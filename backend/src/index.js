// RAILWAY FREE TIER OPTIMIZED BACKEND
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { createServer } from 'http';
import { Server } from 'socket.io';
import process from 'process';

// Import core modules
import prisma from './lib/db.js';
import { initializeSocketHandlers } from './lib/socketHandlers.js';

// Import routes
import authRoutes from './routes/auth.route.js';
import userRoutes from './routes/user.route.js';
import messageRoutes from './routes/message.route.js';
import adminRoutes from './routes/admin.route.js';
import friendRoutes from './routes/friend.route.js';
import settingsRoutes from './routes/settings.route.js';
import healthRoutes from './routes/health.route.js';

// Import middleware
import { activityMonitor } from './middleware/activityMonitor.js';

const PORT = process.env.PORT || 5002;
const app = express();

const startServer = async () => {
  const server = createServer(app);

  // Trust proxy for load balancer
  app.set('trust proxy', 1);

  // Activity Monitor
  app.use(activityMonitor);

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

  // Compression
  app.use(compression({
    level: 6,
    threshold: 1024,
    filter: (req, res) => {
      if (req.headers['x-no-compression']) return false;
      return compression.filter(req, res);
    },
  }));

  // CORS
  app.use(cors({
    origin: ["https://z-app-official.vercel.app", "http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173", process.env.FRONTEND_URL].filter(Boolean),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    optionsSuccessStatus: 200
  }));

  // Body parsing - High limit for media
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // API Routes
  app.use('/health', healthRoutes);
  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/messages', messageRoutes);
  app.use('/api/friends', friendRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/settings', settingsRoutes);

  // Socket.IO
  const io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:5173",
      credentials: true
    },
    transports: ['websocket', 'polling']
  });

  // Initialize Socket Handlers
  try {
    await initializeSocketHandlers(io);
    console.log('✅ Socket handlers initialized');
  } catch (error) {
    console.error('⚠️ Failed to initialize socket handlers:', error);
  }

  // Error Handler
  app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  });

  // 404 Handler
  app.use('*', (req, res) => {
    res.status(404).json({ error: 'Route not found' });
  });

  // Start Server
  server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  });

  // Graceful Shutdown
  const gracefulShutdown = async (signal) => {
    console.log(`\n🔄 Received ${signal}, shutting down...`);
    server.close(async () => {
      console.log('🔌 HTTP server closed');
      io.close();
      try {
        await prisma.$disconnect();
        console.log('🗄️ Database disconnected');
      } catch (err) {
        console.error('Error disconnecting DB:', err);
      }
      process.exit(0);
    });
    // Force exit if hanging
    setTimeout(() => process.exit(1), 10000);
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
};

startServer().catch(err => {
  console.error('❌ Failed to start server:', err);
  process.exit(1);
});
export default app;