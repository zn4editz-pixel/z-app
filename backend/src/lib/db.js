import mongoose from "mongoose";

// ============================================
// OPTIMIZED MONGODB CONNECTION FOR 500K+ USERS
// ============================================

export const connectDB = async () => {
	try {
		// Connection options optimized for high concurrency
		const options = {
			// Connection pooling - critical for scaling
			maxPoolSize: 100, // Max connections in pool (increase for high load)
			minPoolSize: 10, // Min connections to maintain
			
			// Timeouts
			serverSelectionTimeoutMS: 5000, // Timeout for server selection
			socketTimeoutMS: 45000, // Socket timeout
			connectTimeoutMS: 10000, // Connection timeout
			
			// Performance optimizations
			maxIdleTimeMS: 60000, // Close idle connections after 60s
			compressors: ["zlib"], // Enable compression
			
			// Reliability
			retryWrites: true, // Retry failed writes
			retryReads: true, // Retry failed reads
			w: "majority", // Write concern for data safety
		};

		const conn = await mongoose.connect(process.env.MONGODB_URI, options);
		
		console.log(`✅ MongoDB connected: ${conn.connection.host}`);
		console.log(`📊 Connection pool: ${options.minPoolSize}-${options.maxPoolSize} connections`);
		
		// Monitor connection events
		mongoose.connection.on("error", (err) => {
			console.error("❌ MongoDB error:", err.message);
		});
		
		mongoose.connection.on("disconnected", () => {
			console.warn("⚠️ MongoDB disconnected");
		});
		
		mongoose.connection.on("reconnected", () => {
			console.log("✅ MongoDB reconnected");
		});
		
	} catch (error) {
		console.error("❌ MongoDB connection error:", error.message);
		// Don't exit process - let it retry
		setTimeout(connectDB, 5000); // Retry after 5 seconds
	}
};
