import rateLimit from "express-rate-limit";

// ============================================
// PRODUCTION-READY RATE LIMITERS FOR 500K+ USERS
// ============================================

// General API rate limiter - Very permissive for normal usage
export const apiLimiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	max: 1000, // 1000 requests per 15 min = ~1 req/sec per user
	message: "Too many requests from this IP, please try again later.",
	standardHeaders: true,
	legacyHeaders: false,
	// Use Redis store in production for distributed rate limiting
	// store: new RedisStore({ client: redisClient }), // Uncomment when using Redis
});

// Auth rate limiter - Balanced security vs usability
export const authLimiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	max: 20, // 20 login attempts per 15 min (prevents brute force, allows retries)
	message: "Too many authentication attempts, please try again in 15 minutes.",
	standardHeaders: true,
	legacyHeaders: false,
	skipSuccessfulRequests: true, // Don't count successful logins
	// For 500k users: Use Redis store to share rate limit across multiple servers
});

// Message rate limiter - Prevent spam while allowing active conversations
export const messageLimiter = rateLimit({
	windowMs: 1 * 60 * 1000, // 1 minute
	max: 100, // 100 messages per minute (allows fast conversations)
	message: "You're sending messages too quickly. Please slow down.",
	standardHeaders: true,
	legacyHeaders: false,
});

// File upload limiter - Prevent abuse while allowing normal usage
export const uploadLimiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	max: 50, // 50 uploads per 15 min (images, voice messages, etc.)
	message: "Too many uploads, please try again later.",
	standardHeaders: true,
	legacyHeaders: false,
});

// Friend request limiter - Prevent spam
export const friendRequestLimiter = rateLimit({
	windowMs: 60 * 60 * 1000, // 1 hour
	max: 50, // 50 friend requests per hour (generous for active users)
	message: "Too many friend requests, please try again later.",
	standardHeaders: true,
	legacyHeaders: false,
});

// Report limiter - Prevent abuse
export const reportLimiter = rateLimit({
	windowMs: 60 * 60 * 1000, // 1 hour
	max: 10, // 10 reports per hour (enough for legitimate reporting)
	message: "Too many reports submitted, please try again later.",
	standardHeaders: true,
	legacyHeaders: false,
});

// ============================================
// NOTES FOR SCALING TO 500K+ USERS:
// ============================================
// 1. Install Redis: npm install rate-limit-redis redis
// 2. Use Redis store for distributed rate limiting across multiple servers
// 3. Consider using a CDN (Cloudflare) for additional DDoS protection
// 4. Monitor rate limit hits and adjust limits based on real usage patterns
// 5. Implement user-based rate limiting (not just IP) for authenticated routes
// ============================================
