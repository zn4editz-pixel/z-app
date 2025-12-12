// RENDER BACKEND-ONLY SERVER
// This serves ONLY API endpoints, no frontend files
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { createServer } from 'http';
import { Server } from 'socket.io';
import process from 'process';

// Import modules with fallbacks
let prisma, rateLimiters, errorHandler, securityMiddleware;

try {
  const dbModule = await import('./lib/db.js');
  prisma = dbModule.prisma;
} catch (error) {
  console.log('⚠️ Database connection failed:', error.message);
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

const PORT = process.env.PORT || 10000;

console.log(`🚀 Starting Render Backend-Only Server on port ${PORT}`);
startServer();

async function startServer() {
  const app = express();
  const server = createServer(app);

  // Trust proxy for Render
  app.set('trust proxy', 1);

  // Security middleware
  app.use(helmet({
    contentSecurityPolicy: false, // Disable for API-only server
    crossOriginEmbedderPolicy: false
  }));

  // Compression middleware
  app.use(compression({
    level: 6,
    threshold: 1024
  }));

  // CORS configuration - IMPORTANT: Allow your frontend
  app.use(cors({
    origin: [
      process.env.FRONTEND_URL || "http://localhost:5173",
      process.env.CLIENT_URL || "http://localhost:5173",
      "https://z-app-beta-z.onrender.com",
      "http://localhost:5173",
      "http://localhost:3000"
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  }));

  // Body parsing middleware
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Rate limiting
  if (rateLimiters) {
    app.use('/api/auth', rateLimiters.authLimiter);
    app.use('/api', rateLimiters.generalLimiter);
  }

  // Security middleware
  app.use(securityMiddleware);

  // Root endpoint - API status
  app.get('/', (req, res) => {
    res.json({
      message: 'ZN4Studio Chat Backend API',
      status: 'running',
      version: '2.0.0',
      environment: process.env.NODE_ENV || 'development',
      endpoints: {
        health: '/health/ping',
        api: '/api',
        auth: '/api/auth',
        users: '/api/users',
        messages: '/api/messages',
        admin: '/api/admin'
      }
    });
  });

  // Health check endpoints
  app.use('/health', healthRoutes);

  // API routes - ONLY API, NO STATIC FILES
  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/messages', messageRoutes);
  app.use('/api/admin', adminRoutes);

  // Socket.IO setup
  const io = new Server(server, {
    cors: {
      origin: [
        process.env.FRONTEND_URL || "http://localhost:5173",
        process.env.CLIENT_URL || "http://localhost:5173",
        "https://z-app-beta-z.onrender.com"
      ],
      credentials: true
    },
    transports: ['websocket', 'polling']
  });

  // Socket.IO connection handling
  io.on('connection', (socket) => {
    console.log(`🔌 User connected: ${socket.id}`);
    
    socket.on('disconnect', () => {
      console.log(`🔌 User disconnected: ${socket.id}`);
    });
  });

  // Error handling middleware
  app.use(errorHandler);

  // 404 handler for API routes only
  app.use('/api/*', (req, res) => {
    res.status(404).json({ 
      error: 'API endpoint not found',
      path: req.originalUrl,
      method: req.method,
      available_endpoints: ['/api/auth', '/api/users', '/api/messages', '/api/admin']
    });
  });

  // Catch-all for non-API routes
  app.use('*', (req, res) => {
    if (req.originalUrl.startsWith('/api/')) {
      res.status(404).json({ error: 'API endpoint not found' });
    } else {
      res.status(200).json({
        message: 'ZN4Studio Chat Backend API',
        note: 'This is a backend-only server. Frontend is hosted separately.',
        frontend_url: process.env.FRONTEND_URL || 'https://z-app-beta-z.onrender.com',
        api_docs: '/api',
        health_check: '/health/ping'
      });
    }
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
    console.log(`🚀 Render Backend API listening on port ${PORT}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`📊 Memory usage: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} MB`);
    console.log(`🔗 Health check: http://localhost:${PORT}/health/ping`);
    console.log(`🔗 API status: http://localhost:${PORT}/`);
    console.log(`🎯 Frontend URL: ${process.env.FRONTEND_URL || 'Not set'}`);
  });

  // Performance monitoring
  setInterval(() => {
    const memUsage = process.memoryUsage();
    console.log(`📊 Memory: ${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`);
  }, 300000); // Every 5 minutes
}

export default app;