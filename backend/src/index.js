// RAILWAY FREE TIER OPTIMIZED BACKEND
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { createServer } from 'http';
import { Server } from 'socket.io';
import process from 'process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
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
import rateLimit from 'express-rate-limit';
const PORT = process.env.PORT || 5001;
const app = express();

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, '../public')));
const startServer = async () => {
  const server = createServer(app);
  // Trust proxy for load balancer
  app.set('trust proxy', 1);
  // CORS - Production ready configuration
  const allowedOrigins = [
    process.env.FRONTEND_URL,
    process.env.CLIENT_URL,
    "https://z-app-official.vercel.app", // Hardcoded fallback for Vercel
    "http://localhost:5173", // Development
    "http://localhost:3000", // Development
    "http://127.0.0.1:5173", // Development
  ].filter(Boolean);
  app.use(cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, etc.)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      // In production, be strict about origins but log the rejection
      if (process.env.NODE_ENV === 'production') {
        return callback(new Error('Not allowed by CORS'));
      }
      // In development, allow all origins
      return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }));

  // Activity Monitor
  app.use(activityMonitor);

  // Rate Limiting - Production Security
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per window
    message: { error: 'Too many requests, please try again later' },
    standardHeaders: true,
    legacyHeaders: false
  });

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // INCREASED FOR DEV: 100 attempts
    message: { error: 'Too many authentication attempts, please try again later' },
    standardHeaders: true,
    legacyHeaders: false
  });

  // Apply rate limiting
  app.use('/api/', apiLimiter);
  app.use('/api/auth/', authLimiter);
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
  // Socket.IO - Ultra-fast production configuration
  const io = new Server(server, {
    cors: {
      origin: allowedOrigins,
      credentials: true
    },
    transports: ['websocket', 'polling'],
    // ⚡ SPEED OPTIMIZATIONS
    pingTimeout: 20000,     // Reduced from 60s to 20s
    pingInterval: 10000,    // Reduced from 25s to 10s  
    upgradeTimeout: 10000,  // Reduced from 30s to 10s
    maxHttpBufferSize: 5e5, // Reduced from 1MB to 500KB
    // Additional speed optimizations
    allowEIO3: true,
    compression: false,     // Disable compression for speed
    httpCompression: false, // Disable HTTP compression
    perMessageDeflate: false, // Disable per-message compression
    // Connection optimizations
    connectTimeout: 5000,   // 5 second connection timeout
    serveClient: false,     // Don't serve client files
  });
  // Initialize Socket Handlers
  try {
    await initializeSocketHandlers(io);
  } catch (error) {
  }
  // Production Error Handler with Logging
  app.use(async (err, req, res, next) => {
    // Import logger dynamically to avoid circular dependencies
    const { logger } = await import('./lib/logger.js');
    // Log the error with context
    logger.error('Server Error', err, {
      method: req.method,
      url: req.url,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      userId: req.user?.id
    });
    // Don't leak error details in production
    if (process.env.NODE_ENV === 'production') {
      res.status(500).json({
        error: 'Internal server error',
        timestamp: new Date().toISOString(),
        requestId: req.id || Date.now()
      });
    } else {
      res.status(500).json({
        error: 'Internal server error',
        details: err.message,
        stack: err.stack,
        timestamp: new Date().toISOString()
      });
    }
  });
  // 404 Handler & SPA Fallback
  app.use('*', (req, res) => {
    if (req.originalUrl.startsWith('/api')) {
      return res.status(404).json({ error: 'Route not found' });
    }
    // Serve index.html for all other routes (SPA support)
    res.sendFile(path.join(__dirname, '../public', 'index.html'));
  });
  // Start Server
  server.listen(PORT, () => {
  });
  // Graceful Shutdown
  const gracefulShutdown = async (signal) => {
    server.close(async () => {
      io.close();
      try {
        await prisma.$disconnect();
      } catch (err) {
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
  process.exit(1);
});
export default app;