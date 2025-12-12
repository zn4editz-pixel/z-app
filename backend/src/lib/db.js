import prisma from './prisma.js';

// Database connection wrapper with error handling
export const safeQuery = async (queryFn, fallbackResponse = null) => {
	try {
		if (!isConnected) {
			throw new Error('Database not connected');
		}
		return await queryFn();
	} catch (error) {
		console.error('Database query error:', error.message);
		if (fallbackResponse !== null) {
			return fallbackResponse;
		}
		throw error;
	}
};

// ============================================
// POSTGRESQL CONNECTION (ULTRA FAST!)
// Using Prisma for 10x performance boost
// ============================================

let isConnected = false;
let retryCount = 0;
const maxRetries = 3;

export const connectDB = async () => {
	try {
		console.log('🚀 Connecting to SQLite (Local Development)...');
		
		// Test the connection with timeout
		await Promise.race([
			prisma.$connect(),
			new Promise((_, reject) => 
				setTimeout(() => reject(new Error('Connection timeout')), 10000)
			)
		]);
		
		// Verify connection with a simple query
		const userCount = await prisma.user.count();
		
		console.log(`✅ SQLite connected successfully`);
		console.log(`📊 Database: ${userCount} users`);
		console.log(`⚡ Local development database ready`);
		
		isConnected = true;
		retryCount = 0;
		
	} catch (error) {
		console.error("❌ Database connection error:", error.message);
		
		retryCount++;
		if (retryCount <= maxRetries) {
			console.log(`🔄 Retrying connection (${retryCount}/${maxRetries}) in 10 seconds...`);
			setTimeout(connectDB, 10000); // Retry after 10 seconds
		} else {
			console.log(`⚠️  Database connection failed after ${maxRetries} attempts`);
			console.log(`🚀 Server will continue running without database connection`);
			console.log(`📝 Note: Some features may not work until database is available`);
		}
	}
};

export const isDatabaseConnected = () => isConnected;

// Graceful shutdown
process.on('beforeExit', async () => {
	await prisma.$disconnect();
	console.log('👋 PostgreSQL disconnected');
});

