import Redis from "ioredis";

// Redis configuration for distributed caching and rate limiting
let redisClient;

// Check if we have Redis URL (preferred) or individual credentials
if (process.env.REDIS_URL) {
	// Use full Redis URL (e.g., from Upstash)
	console.log("🔴 Redis: Using REDIS_URL connection");
	redisClient = new Redis(process.env.REDIS_URL, {
		maxRetriesPerRequest: 3,
		enableReadyCheck: true,
		tls: {
			rejectUnauthorized: false,
		},
		retryStrategy: (times) => {
			const delay = Math.min(times * 50, 2000);
			return delay;
		},
	});
} else if (process.env.REDIS_HOST) {
	// Use individual credentials
	console.log("🔴 Redis: Using individual credentials");
	const redisConfig = {
		host: process.env.REDIS_HOST,
		port: parseInt(process.env.REDIS_PORT) || 6379,
		password: process.env.REDIS_PASSWORD,
		maxRetriesPerRequest: 3,
		enableReadyCheck: true,
		tls: {
			rejectUnauthorized: false,
		},
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
	redisClient = new Redis(redisConfig);
} else {
	// No Redis configured - create a dummy client
	console.log("⚠️ Redis: No configuration found, running without Redis");
	redisClient = null;
}

export { redisClient };

// Redis event handlers (only if Redis is configured)
if (redisClient) {
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
}

// Helper functions for caching
export const cacheHelpers = {
	// Set cache with TTL (in seconds)
	async set(key, value, ttl = 300) {
		if (!redisClient) return false;
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
		if (!redisClient) return null;
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
		if (!redisClient) return false;
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
		if (!redisClient) return false;
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
		if (!redisClient) return false;
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
		if (!redisClient) return 0;
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
