// SIMPLE WORKING BACKEND FOR RENDER
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { createServer } from 'http';
import { Server } from 'socket.io';
import process from 'process';

// Import basic modules
let prisma;
try {
  const dbModule = await import('./lib/db.js');
  prisma = dbModule.prisma;
} catch (error) {
  console.log('⚠️ Database not available');
}

// Import simple rate limiters
let rateLimiters;
try {
  const rateLimitModule = await import('./middleware/rateLimiter.simple.js');
  rateLimiters = rateLimitModule.default;
} catch (error) {
  console.log('⚠️ Rate limiter not available');
  rateLimiters = {
    authLimiter: (req, res, next) => next(),
    generalLimiter: (req, res, next) => next()
  };
}

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 10000;

// Basic middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: false,
}));

app.use(compression());

app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://z-app-official.vercel.app',
    'https://z-app-frontend.vercel.app',
    process.env.FRONTEND_URL
  ].filter(Boolean),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-requested-with'],
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Apply rate limiting
if (rateLimiters?.generalLimiter) {
  app.use(rateLimiters.generalLimiter);
}

// Health check routes
app.get('/health/ping', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB'
  });
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    service: 'z-app-backend',
    version: '2.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Basic API routes
app.get('/api/test', (req, res) => {
  res.json({ message: 'Backend is working!', timestamp: new Date().toISOString() });
});

// Import and use routes (with error handling)
try {
  const authRoutes = await import('./routes/auth.route.js');
  app.use('/api/auth', authRoutes.default);
} catch (error) {
  console.log('⚠️ Auth routes not available:', error.message);
}

try {
  const userRoutes = await import('./routes/user.route.js');
  app.use('/api/users', userRoutes.default);
} catch (error) {
  console.log('⚠️ User routes not available:', error.message);
}

try {
  const messageRoutes = await import('./routes/message.route.js');
  app.use('/api/messages', messageRoutes.default);
} catch (error) {
  console.log('⚠️ Message routes not available:', error.message);
}

try {
  const adminRoutes = await import('./routes/admin.route.js');
  app.use('/api/admin', adminRoutes.default);
} catch (error) {
  console.log('⚠️ Admin routes not available:', error.message);
}

// Socket.IO setup
const io = new Server(server, {
  cors: {
    origin: [
      'http://localhost:5173',
      'http://localhost:3000',
      'https://z-app-official.vercel.app',
      'https://z-app-frontend.vercel.app',
      process.env.FRONTEND_URL
    ].filter(Boolean),
    credentials: true,
  },
  transports: ['websocket', 'polling'],
});

io.on('connection', (socket) => {
  console.log('👤 User connected:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('👤 User disconnected:', socket.id);
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
server.listen(PORT, () => {
  console.log(`🚀 Simple Backend listening on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📊 Memory usage: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} MB`);
  console.log(`🔗 Health check: /health/ping`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
});

export default app;