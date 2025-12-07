import Redis from "ioredis";

// Redis configuration for distributed caching and rate limiting
const redisConfig = {
	host: process.env.REDIS_HOST || "localhost",
	port: parseInt(process.env.REDIS_PORT) || 6379,
	password: process.env.REDIS_PASSWORD || undefined,
	maxRetriesPerRequest: 3,
	enableReadyCheck: true,
	// Enable TLS for Upstash and other cloud Redis providers
	tls: process.env.REDIS_HOST ? {
		rejectUnauthorized: false, // Required for Upstash
	} : undefined,
	retryStrategy: (times) => {
		const delay = Math.min(times * 50, 2000);
		return delay;
	},
	reconnectOnError: (err) => {
		const targetError = "READONLY";
		if (err.message.includes(targetError)) {
			return true;
		}
		return false;
	},
};

// Create Redis client
export const redisClient = new Redis(redisConfig);

// Redis event handlers
redisClient.on("connect", () => {
	console.log("🔴 Redis: Connecting...");
});

redisClient.on("ready", () => {
	console.log("✅ Redis: Connected and ready");
});

redisClient.on("error", (err) => {
	console.error("❌ Redis Error:", err.message);
	// Don't crash the app if Redis is unavailable
	// Rate limiting will fall back to in-memory store
});

redisClient.on("close", () => {
	console.log("🔴 Redis: Connection closed");
});

redisClient.on("reconnecting", () => {
	console.log("🔄 Redis: Reconnecting...");
});

// Graceful shutdown
process.on("SIGTERM", async () => {
	console.log("🔴 Redis: Closing connection...");
	await redisClient.quit();
});

// Helper functions for caching
export const cacheHelpers = {
	// Set cache with TTL (in seconds)
	async set(key, value, ttl = 300) {
		try {
			await redisClient.setex(key, ttl, JSON.stringify(value));
			return true;
		} catch (error) {
			console.error("Redis set error:", error.message);
			return false;
		}
	},

	// Get cached value
	async get(key) {
		try {
			const value = await redisClient.get(key);
			return value ? JSON.parse(value) : null;
		} catch (error) {
			console.error("Redis get error:", error.message);
			return null;
		}
	},

	// Delete cache
	async del(key) {
		try {
			await redisClient.del(key);
			return true;
		} catch (error) {
			console.error("Redis del error:", error.message);
			return false;
		}
	},

	// Delete multiple keys by pattern
	async delPattern(pattern) {
		try {
			const keys = await redisClient.keys(pattern);
			if (keys.length > 0) {
				await redisClient.del(...keys);
			}
			return true;
		} catch (error) {
			console.error("Redis delPattern error:", error.message);
			return false;
		}
	},

	// Check if key exists
	async exists(key) {
		try {
			const result = await redisClient.exists(key);
			return result === 1;
		} catch (error) {
			console.error("Redis exists error:", error.message);
			return false;
		}
	},

	// Increment counter
	async incr(key, ttl = 3600) {
		try {
			const value = await redisClient.incr(key);
			if (value === 1 && ttl) {
				await redisClient.expire(key, ttl);
			}
			return value;
		} catch (error) {
			console.error("Redis incr error:", error.message);
			return 0;
		}
	},
};

export default redisClient;
