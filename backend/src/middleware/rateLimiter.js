// PRODUCTION RATE LIMITING FOR 500K+ USERS
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';

// Fallback to memory store if Redis not available
let redisStore;
try {
  const { redis } = await import('../lib/db.production.js');
  redisStore = new RedisStore({
    sendCommand: (...args) => redis.call(...args),
    prefix: 'rl:general:',
  });
} catch (error) {
  console.log('⚠️ Redis not available, using memory store for rate limiting');
  redisStore = undefined; // Use default memory store
}

// General API rate limiting
export const generalLimiter = rateLimit({
  store: redisStore ? new RedisStore({
    sendCommand: (...args) => redisStore.sendCommand(...args),
    prefix: 'rl:general:',
  }) : undefined,
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Authentication rate limiting (stricter)
export const authLimiter = rateLimit({
  store: redisStore ? new RedisStore({
    sendCommand: (...args) => redisStore.sendCommand(...args),
    prefix: 'rl:auth:',
  }) : undefined,
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 auth attempts per windowMs
  message: {
    error: 'Too many authentication attempts, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
});

// Message sending rate limiting
export const messageLimiter = rateLimit({
  store: redisStore ? new RedisStore({
    sendCommand: (...args) => redisStore.sendCommand(...args),
    prefix: 'rl:messages:',
  }) : undefined,
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60, // 60 messages per minute per user
  message: {
    error: 'Message rate limit exceeded. Please slow down.',
    retryAfter: '1 minute'
  },
});

// File upload rate limiting
export const uploadLimiter = rateLimit({
  store: redisStore,
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 20, // 20 uploads per 5 minutes
  message: {
    error: 'Upload rate limit exceeded. Please wait before uploading more files.',
    retryAfter: '5 minutes'
  },
  keyGenerator: (req) => `uploads:${req.user.id}`,
});

// Friend request rate limiting
export const friendRequestLimiter = rateLimit({
  store: redisStore,
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // 50 friend requests per hour
  message: {
    error: 'Friend request rate limit exceeded. Please wait before sending more requests.',
    retryAfter: '1 hour'
  },
  keyGenerator: (req) => `friend_requests:${req.user.id}`,
});

// Admin API rate limiting (more permissive for admin users)
export const adminLimiter = rateLimit({
  store: redisStore,
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5000, // Higher limit for admin operations
  message: {
    error: 'Admin API rate limit exceeded.',
    retryAfter: '15 minutes'
  },
  keyGenerator: (req) => `admin:${req.user.id}`,
});

// Search rate limiting
export const searchLimiter = rateLimit({
  store: redisStore,
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // 30 searches per minute
  message: {
    error: 'Search rate limit exceeded. Please wait before searching again.',
    retryAfter: '1 minute'
  },
  keyGenerator: (req) => `search:${req.user?.id || req.ip}`,
});

// Password reset rate limiting
export const passwordResetLimiter = rateLimit({
  store: redisStore,
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 password reset attempts per hour
  message: {
    error: 'Too many password reset attempts. Please try again later.',
    retryAfter: '1 hour'
  },
  keyGenerator: (req) => `password_reset:${req.ip}`,
});

// Registration rate limiting
export const registrationLimiter = rateLimit({
  store: redisStore,
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 registrations per hour per IP
  message: {
    error: 'Registration rate limit exceeded. Please try again later.',
    retryAfter: '1 hour'
  },
  keyGenerator: (req) => `registration:${req.ip}`,
});

// Advanced rate limiting with sliding window
export class SlidingWindowRateLimiter {
  constructor(windowSize, maxRequests, keyPrefix) {
    this.windowSize = windowSize; // in seconds
    this.maxRequests = maxRequests;
    this.keyPrefix = keyPrefix;
  }

  async isAllowed(identifier) {
    const key = `${this.keyPrefix}:${identifier}`;
    const now = Date.now();
    const windowStart = now - (this.windowSize * 1000);

    try {
      // Remove old entries
      await redis.zremrangebyscore(key, 0, windowStart);
      
      // Count current requests
      const currentRequests = await redis.zcard(key);
      
      if (currentRequests >= this.maxRequests) {
        return false;
      }

      // Add current request
      await redis.zadd(key, now, `${now}-${Math.random()}`);
      await redis.expire(key, this.windowSize);
      
      return true;
    } catch (error) {
      console.error('Rate limiter error:', error);
      return true; // Fail open
    }
  }

  async getRemainingRequests(identifier) {
    const key = `${this.keyPrefix}:${identifier}`;
    const now = Date.now();
    const windowStart = now - (this.windowSize * 1000);

    try {
      await redis.zremrangebyscore(key, 0, windowStart);
      const currentRequests = await redis.zcard(key);
      return Math.max(0, this.maxRequests - currentRequests);
    } catch (error) {
      console.error('Rate limiter error:', error);
      return this.maxRequests;
    }
  }
}

// WebSocket rate limiter
export const wsRateLimiter = new SlidingWindowRateLimiter(60, 100, 'ws_rate_limit');

// API burst protection
export const burstProtection = new SlidingWindowRateLimiter(10, 50, 'burst_protection');

// Custom middleware for advanced rate limiting
export const advancedRateLimit = (limiter) => {
  return async (req, res, next) => {
    const identifier = req.user?.id || req.ip;
    
    const isAllowed = await limiter.isAllowed(identifier);
    
    if (!isAllowed) {
      const remaining = await limiter.getRemainingRequests(identifier);
      
      return res.status(429).json({
        error: 'Rate limit exceeded',
        retryAfter: limiter.windowSize,
        remaining: remaining,
      });
    }

    next();
  };
};

// Rate limit monitoring
export class RateLimitMonitor {
  static async getStats() {
    try {
      const keys = await redis.keys('rate_limit:*');
      const stats = {};
      
      for (const key of keys) {
        const count = await redis.get(key);
        const ttl = await redis.ttl(key);
        stats[key] = { count: parseInt(count) || 0, ttl };
      }
      
      return stats;
    } catch (error) {
      console.error('Rate limit stats error:', error);
      return {};
    }
  }

  static async clearUserLimits(userId) {
    try {
      const patterns = [
        `messages:${userId}`,
        `uploads:${userId}`,
        `friend_requests:${userId}`,
        `search:${userId}`,
      ];
      
      for (const pattern of patterns) {
        await redis.del(pattern);
      }
    } catch (error) {
      console.error('Clear rate limits error:', error);
    }
  }
}

export default {
  generalLimiter,
  authLimiter,
  messageLimiter,
  uploadLimiter,
  friendRequestLimiter,
  adminLimiter,
  searchLimiter,
  passwordResetLimiter,
  registrationLimiter,
  advancedRateLimit,
  wsRateLimiter,
  burstProtection,
  RateLimitMonitor,
};