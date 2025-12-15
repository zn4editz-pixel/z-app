// PRODUCTION BACKEND SERVER FOR 500K+ USERS
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { createServer } from 'http';
import cluster from 'cluster';
import os from 'os';
import process from 'process';

// Import production optimized modules
import { prisma } from './lib/db.production.js';
import SocketCluster from './lib/socket.cluster.js';
import rateLimiters from './middleware/rateLimiter.js';
import { errorHandler } from './middleware/errorHandler.js';
import { securityMiddleware } from './middleware/security.js';

// Import routes
import authRoutes from './routes/auth.route.js';
import userRoutes from './routes/user.route.js';
import messageRoutes from './routes/message.route.js';
import adminRoutes from './routes/admin.route.js';
import healthRoutes from './routes/health.route.js';

const PORT = process.env.PORT || 5001;
const CLUSTER_WORKERS = process.env.CLUSTER_WORKERS || os.cpus().length;

// Cluster setup for horizontal scaling
if (cluster.isPrimary && process.env.NODE_ENV === 'production') {
  console.log(`🚀 Master process ${process.pid} is running`);
  console.log(`🔧 Starting ${CLUSTER_WORKERS} workers...`);

  // Fork workers
  for (let i = 0; i < CLUSTER_WORKERS; i++) {
    cluster.fork();
  }

  // Handle worker crashes
  cluster.on('exit', (worker, code, signal) => {
    console.log(`💥 Worker ${worker.process.pid} died with code ${code} and signal ${signal}`);
    console.log('🔄 Starting a new worker...');
    cluster.fork();
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('🔄 Master received SIGTERM, shutting down gracefully...');

    for (const id in cluster.workers) {
      cluster.workers[id].kill();
    }

    setTimeout(() => {
      console.log('💀 Forcing shutdown...');
      process.exit(1);
    }, 10000);
  });

} else {
  // Worker process
  startWorker();
}

async function startWorker() {
  const app = express();
  const server = createServer(app);

  // Trust proxy for load balancer
  app.set('trust proxy', 1);

  // Security middleware
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", "ws:", "wss:"],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
  }));

  // Compression middleware
  app.use(compression({
    level: 6,
    threshold: 1024,
    filter: (req, res) => {
      if (req.headers['x-no-compression']) {
        return false;
      }
      return compression.filter(req, res);
    },
  }));

  // CORS configuration
  app.use(cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  }));

  // Body parsing middleware
  app.use(express.json({
    limit: '10mb',
    verify: (req, res, buf) => {
      req.rawBody = buf;
    }
  }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Rate limiting
  app.use('/api/auth', rateLimiters.authLimiter);
  app.use('/api', rateLimiters.generalLimiter);

  // Security middleware
  app.use(securityMiddleware);

  // Health check endpoint (before other routes)
  app.use('/health', healthRoutes);

  // API routes
  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/messages', messageRoutes);
  app.use('/api/admin', adminRoutes);

  // Socket.IO setup with clustering
  const socketCluster = new SocketCluster(server);

  // Error handling middleware
  app.use(errorHandler);

  // 404 handler
  app.use('*', (req, res) => {
    res.status(404).json({
      error: 'Route not found',
      path: req.originalUrl,
      method: req.method,
    });
  });

  // Graceful shutdown handling
  const gracefulShutdown = async (signal) => {
    console.log(`🔄 Worker ${process.pid} received ${signal}, shutting down gracefully...`);

    server.close(async () => {
      console.log('🔌 HTTP server closed');

      try {
        await socketCluster.shutdown();
        console.log('🔌 Socket.IO server closed');

        await prisma.$disconnect();
        console.log('🗄️ Database connection closed');

        process.exit(0);
      } catch (error) {
        console.error('❌ Error during shutdown:', error);
        process.exit(1);
      }
    });

    // Force shutdown after 10 seconds
    setTimeout(() => {
      console.log('💀 Forcing shutdown...');
      process.exit(1);
    }, 10000);
  };

  // Handle shutdown signals
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    console.error('💥 Uncaught Exception:', error);
    gracefulShutdown('uncaughtException');
  });

  process.on('unhandledRejection', (reason, promise) => {
    console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
    gracefulShutdown('unhandledRejection');
  });

  // Start server
  server.listen(PORT, () => {
    console.log(`🚀 Worker ${process.pid} listening on port ${PORT}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
    console.log(`📊 Memory usage: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} MB`);
  });

  // Performance monitoring
  setInterval(() => {
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();

    console.log(`📊 Worker ${process.pid} - Memory: ${Math.round(memUsage.heapUsed / 1024 / 1024)}MB, CPU: ${cpuUsage.user + cpuUsage.system}μs`);
  }, 60000); // Every minute
}

// End of worker process