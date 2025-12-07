import rateLimit from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import redisClient from "../lib/redis.js";

// ============================================
// PRODUCTION-READY RATE LIMITERS FOR 500K+ USERS
// ============================================

// Check if Redis is available
const useRedis = (process.env.REDIS_URL || process.env.REDIS_HOST) && redisClient && process.env.NODE_ENV === "production";

// Create Redis store configuration
const createRedisStore = (prefix) => {
	if (!useRedis) return undefined;
	
	try {
		return new RedisStore({
			client: redisClient,
			prefix: `rl:${prefix}:`,
			sendCommand: (...args) => redisClient.call(...args),
		});
	} catch (error) {
		console.error(`Failed to create Redis store for ${prefix}:`, error.message);
		return undefined;
	}
};

// General API rate limiter - Very permissive for normal usage
export const apiLimiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	max: 1000, // 1000 requests per 15 min = ~1 req/sec per user
	message: "Too many requests from this IP, please try again later.",
	standardHeaders: true,
	legacyHeaders: false,
	store: createRedisStore("api"),
});

// Auth rate limiter - Balanced security vs usability
export const authLimiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	max: 20, // 20 login attempts per 15 min (prevents brute force, allows retries)
	message: "Too many authentication attempts, please try again in 15 minutes.",
	standardHeaders: true,
	legacyHeaders: false,
	skipSuccessfulRequests: true, // Don't count successful logins
	store: createRedisStore("auth"),
});

// Message rate limiter - Prevent spam while allowing active conversations
export const messageLimiter = rateLimit({
	windowMs: 1 * 60 * 1000, // 1 minute
	max: 100, // 100 messages per minute (allows fast conversations)
	message: "You're sending messages too quickly. Please slow down.",
	standardHeaders: true,
	legacyHeaders: false,
	store: createRedisStore("message"),
});

// File upload limiter - Prevent abuse while allowing normal usage
export const uploadLimiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	max: 50, // 50 uploads per 15 min (images, voice messages, etc.)
	message: "Too many uploads, please try again later.",
	standardHeaders: true,
	legacyHeaders: false,
	store: createRedisStore("upload"),
});

// Friend request limiter - Prevent spam
export const friendRequestLimiter = rateLimit({
	windowMs: 60 * 60 * 1000, // 1 hour
	max: 50, // 50 friend requests per hour (generous for active users)
	message: "Too many friend requests, please try again later.",
	standardHeaders: true,
	legacyHeaders: false,
	store: createRedisStore("friend"),
});

// Report limiter - Prevent abuse
export const reportLimiter = rateLimit({
	windowMs: 60 * 60 * 1000, // 1 hour
	max: 10, // 10 reports per hour (enough for legitimate reporting)
	message: "Too many reports submitted, please try again later.",
	standardHeaders: true,
	legacyHeaders: false,
	store: createRedisStore("report"),
});

// ============================================
// REDIS STATUS
// ============================================
console.log(`🔐 Rate Limiting: ${useRedis ? "Redis (Distributed)" : "Memory (Single Server)"}`);

// ============================================
// NOTES FOR SCALING TO 500K+ USERS:
// ============================================
// ✅ Redis integration: DONE - Distributed rate limiting enabled
// ✅ Optimized limits: DONE - Balanced security vs usability
// 🔄 Next steps:
//    1. Set REDIS_HOST, REDIS_PORT, REDIS_PASSWORD in environment
//    2. Deploy multiple backend instances with load balancer
//    3. Enable Socket.io Redis adapter for WebSocket scaling
//    4. Use CDN (Cloudflare) for DDoS protection
//    5. Monitor with New Relic/Datadog
// ============================================
