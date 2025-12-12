// RAILWAY FREE TIER OPTIMIZED BACKEND
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { createServer } from 'http';
import { Server } from 'socket.io';
import process from 'process';

// Import modules (fallback to basic if production modules fail)
let prisma, rateLimiters, errorHandler, securityMiddleware;

try {
  const dbModule = await import('./lib/db.production.js');
  prisma = dbModule.prisma;
} catch (error) {
  console.log('⚠️ Production DB not available, using basic DB...');
  const dbModule = await import('./lib/db.js');
  prisma = dbModule.prisma;
}

try {
  const rateLimitModule = await import('./middleware/rateLimiter.js');
  rateLimiters = rateLimitModule.default;
} catch (error) {
  console.log('⚠️ Rate limiter not available, using basic limits...');
  rateLimiters = {
    authLimiter: (req, res, next) => next(),
    generalLimiter: (req, res, next) => next()
  };
}

try {
  const errorModule = await import('./middleware/errorHandler.js');
  errorHandler = errorModule.errorHandler;
} catch (error) {
  console.log('⚠️ Error handler not available, using basic handler...');
  errorHandler = (err, req, res, next) => {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  };
}

try {
  const securityModule = await import('./middleware/security.js');
  securityMiddleware = securityModule.securityMiddleware;
} catch (error) {
  console.log('⚠️ Security middleware not available, using basic security...');
  securityMiddleware = (req, res, next) => next();
}

// Import routes
import authRoutes from './routes/auth.route.js';
import userRoutes from './routes/user.route.js';
import messageRoutes from './routes/message.route.js';
import adminRoutes from './routes/admin.route.js';
import healthRoutes from './routes/health.route.js';

const PORT = process.env.PORT || 5001;

// Railway Free Tier - Single Process (no clustering to save memory)
console.log(`🚀 Starting Railway Free Tier Backend on port ${PORT}`);
startServer();

async function startServer() {
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

  // Socket.IO setup (basic for Railway free tier)
  const io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:5173",
      credentials: true
    },
    transports: ['websocket', 'polling']
  });

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
    console.log(`🔄 Server received ${signal}, shutting down gracefully...`);
    
    server.close(async () => {
      console.log('🔌 HTTP server closed');
      
      try {
        io.close();
        console.log('🔌 Socket.IO server closed');
        
        if (prisma) {
          await prisma.$disconnect();
          console.log('🗄️ Database connection closed');
        }
        
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
    console.log(`🚀 Railway Backend listening on port ${PORT}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`📊 Memory usage: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} MB`);
    console.log(`🔗 Health check: /health/ping`);
  });

  // Basic performance monitoring (less frequent for free tier)
  setInterval(() => {
    const memUsage = process.memoryUsage();
    console.log(`📊 Memory: ${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`);
  }, 300000); // Every 5 minutes
}

export default app;