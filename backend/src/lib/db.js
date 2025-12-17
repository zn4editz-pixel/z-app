// PRODUCTION DATABASE CONNECTION
import { PrismaClient } from '@prisma/client';

// Validate database URL
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is required');
  process.exit(1);
}

// Prisma configuration with production optimizations
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  // Production optimizations
  ...(process.env.NODE_ENV === 'production' && {
    connectionLimit: 10,
    pool: {
      timeout: 20,
      idleTimeout: 300,
    },
  }),
});

// Simple in-memory cache
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
    for (const key of cache.keys()) {
      if (key.includes(pattern.replace('*', ''))) {
        cache.delete(key);
      }
    }
  }
}

// Database query optimization utilities
export class QueryOptimizer {
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
        await DatabaseCache.set(cacheKey, user, 600);
      }
    }
    return user;
  }

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

  static async batchUpdateUserStatus(userIds, isOnline) {
    await prisma.user.updateMany({
      where: { id: { in: userIds } },
      data: {
        isOnline,
        lastSeen: new Date(),
      },
    });

    for (const userId of userIds) {
      await DatabaseCache.del(`user:${userId}`);
    }
  }
}

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

export { prisma };
export default prisma;