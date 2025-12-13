// SIMPLE DATABASE CONNECTION - NO REDIS DEPENDENCIES
import { PrismaClient } from '@prisma/client';

// Simple Prisma configuration
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL || "file:./dev.db",
    },
  },
});

// Connection pool optimization
prisma.$connect().catch(error => {
  console.error('❌ Database connection failed:', error);
  process.exit(1);
});

// Database connection monitoring
prisma.$on('query', (e) => {
  if (e.duration > 1000) {
    console.warn(`🐌 Slow query detected: ${e.duration}ms - ${e.query}`);
  }
});

// Simple in-memory cache (no Redis)
const cache = new Map();

export class DatabaseCache {
  static async get(key) {
    const cached = cache.get(key);
    if (cached && cached.expires > Date.now()) {
      return cached.value;
    }
    cache.delete(key);
    return null;
  }

  static async set(key, value, ttl = 300) {
    cache.set(key, {
      value,
      expires: Date.now() + (ttl * 1000)
    });
  }

  static async del(key) {
    cache.delete(key);
  }

  static async invalidatePattern(pattern) {
    // Simple pattern matching for in-memory cache
    for (const key of cache.keys()) {
      if (key.includes(pattern.replace('*', ''))) {
        cache.delete(key);
      }
    }
  }
}

// Database query optimization utilities
export class QueryOptimizer {
  // Optimized user queries with caching
  static async findUserById(id) {
    const cacheKey = `user:${id}`;
    let user = await DatabaseCache.get(cacheKey);
    
    if (!user) {
      user = await prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          username: true,
          email: true,
          nickname: true,
          profilePic: true,
          isOnline: true,
          lastSeen: true,
          isVerified: true,
          country: true,
          city: true,
        },
      });
      
      if (user) {
        await DatabaseCache.set(cacheKey, user, 600); // 10 minutes
      }
    }
    
    return user;
  }

  // Optimized message queries with pagination
  static async getMessages(senderId, receiverId, page = 1, limit = 50) {
    const offset = (page - 1) * limit;
    
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId, receiverId },
          { senderId: receiverId, receiverId: senderId },
        ],
      },
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: limit,
      select: {
        id: true,
        text: true,
        image: true,
        voice: true,
        voiceDuration: true,
        createdAt: true,
        status: true,
        senderId: true,
        receiverId: true,
        replyToId: true,
        isDeleted: true,
        reactions: true,
        isCallLog: true,
        callType: true,
        callDuration: true,
        callStatus: true,
      },
    });
    
    return messages;
  }

  // Batch operations for better performance
  static async batchUpdateUserStatus(userIds, isOnline) {
    await prisma.user.updateMany({
      where: { id: { in: userIds } },
      data: { 
        isOnline,
        lastSeen: new Date(),
      },
    });

    // Invalidate cache for updated users
    for (const userId of userIds) {
      await DatabaseCache.del(`user:${userId}`);
    }
  }
}

// Connection monitoring
export class ConnectionMonitor {
  static async checkHealth() {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return { database: 'healthy' };
    } catch (error) {
      return { database: 'unhealthy', error: error.message };
    }
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('🔄 Gracefully shutting down database connections...');
  await prisma.$disconnect();
  process.exit(0);
});

export { prisma };
export default prisma;