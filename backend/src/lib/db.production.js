// PRODUCTION DATABASE CONNECTION - OPTIMIZED FOR 500K+ USERS
import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';

// Advanced Prisma configuration for massive scale
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

// Connection pool optimization
prisma.$connect();

// Redis configuration with fallback
let redis = null;

try {
  if (process.env.REDIS_URL) {
    // Single Redis instance (most hosting providers)
    redis = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      retryDelayOnFailover: 100,
      enableReadyCheck: false,
      lazyConnect: true,
      connectTimeout: 10000,
      commandTimeout: 5000,
    });
  } else if (process.env.REDIS_HOST) {
    // Redis cluster configuration
    redis = new Redis.Cluster([
      {
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT || 6379,
      },
    ], {
      redisOptions: {
        password: process.env.REDIS_PASSWORD,
        maxRetriesPerRequest: 3,
        retryDelayOnFailover: 100,
        enableReadyCheck: false,
        connectTimeout: 10000,
        commandTimeout: 5000,
      },
      enableOfflineQueue: false,
      scaleReads: 'slave',
    });
  }
} catch (error) {
  console.log('⚠️ Redis not available, using in-memory cache fallback');
  redis = null;
}

// Database connection monitoring
prisma.$on('query', (e) => {
  if (e.duration > 1000) {
    console.warn(`🐌 Slow query detected: ${e.duration}ms - ${e.query}`);
  }
});

// Redis connection monitoring (only if Redis is available)
if (redis) {
  redis.on('connect', () => {
    console.log('✅ Redis connected');
  });

  redis.on('error', (err) => {
    console.error('❌ Redis error:', err);
    // Don't crash the app, just log the error
  });

  redis.on('close', () => {
    console.log('🔴 Redis connection closed');
  });
}

// Advanced caching utilities with Redis fallback
const inMemoryCache = new Map();

export class DatabaseCache {
  static async get(key) {
    try {
      if (redis && redis.status === 'ready') {
        const cached = await redis.get(key);
        return cached ? JSON.parse(cached) : null;
      } else {
        // Fallback to in-memory cache
        const cached = inMemoryCache.get(key);
        if (cached && cached.expires > Date.now()) {
          return cached.value;
        }
        inMemoryCache.delete(key);
        return null;
      }
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  static async set(key, value, ttl = 300) {
    try {
      if (redis && redis.status === 'ready') {
        await redis.setex(key, ttl, JSON.stringify(value));
      } else {
        // Fallback to in-memory cache
        inMemoryCache.set(key, {
          value,
          expires: Date.now() + (ttl * 1000)
        });
      }
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  static async del(key) {
    try {
      if (redis && redis.status === 'ready') {
        await redis.del(key);
      } else {
        inMemoryCache.delete(key);
      }
    } catch (error) {
      console.error('Cache delete error:', error);
    }
  }

  static async invalidatePattern(pattern) {
    try {
      if (redis && redis.status === 'ready') {
        const keys = await redis.keys(pattern);
        if (keys.length > 0) {
          await redis.del(...keys);
        }
      } else {
        // Fallback: clear all in-memory cache for simplicity
        inMemoryCache.clear();
      }
    } catch (error) {
      console.error('Cache invalidate error:', error);
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
    const cacheKey = `messages:${senderId}:${receiverId}:${page}:${limit}`;
    
    let messages = await DatabaseCache.get(cacheKey);
    
    if (!messages) {
      messages = await prisma.message.findMany({
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
          content: true,
          type: true,
          createdAt: true,
          isRead: true,
          senderId: true,
          receiverId: true,
          fileUrl: true,
          fileName: true,
        },
      });
      
      await DatabaseCache.set(cacheKey, messages, 60); // 1 minute
    }
    
    return messages;
  }

  // Optimized friend queries
  static async getFriends(userId) {
    const cacheKey = `friends:${userId}`;
    let friends = await DatabaseCache.get(cacheKey);
    
    if (!friends) {
      friends = await prisma.friend.findMany({
        where: { userId },
        include: {
          friend: {
            select: {
              id: true,
              username: true,
              nickname: true,
              profilePic: true,
              isOnline: true,
              lastSeen: true,
            },
          },
        },
      });
      
      await DatabaseCache.set(cacheKey, friends, 300); // 5 minutes
    }
    
    return friends;
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

// Connection pool monitoring
export class ConnectionMonitor {
  static async getStats() {
    try {
      const result = await prisma.$queryRaw`
        SELECT 
          count(*) as total_connections,
          count(*) FILTER (WHERE state = 'active') as active_connections,
          count(*) FILTER (WHERE state = 'idle') as idle_connections
        FROM pg_stat_activity 
        WHERE datname = current_database()
      `;
      
      return result[0];
    } catch (error) {
      console.error('Connection stats error:', error);
      return null;
    }
  }

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
  if (redis) {
    redis.disconnect();
  }
  process.exit(0);
});

export { prisma, redis };
export default prisma;