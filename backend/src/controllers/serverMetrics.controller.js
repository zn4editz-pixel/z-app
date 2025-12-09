import os from "os";
import prisma from "../lib/prisma.js";
import { redisClient } from "../lib/redis.js";

// Store metrics history in memory (in production, use Redis)
const metricsHistory = [];
const MAX_HISTORY = 100;

// Performance thresholds
const THRESHOLDS = {
	backend: { warning: 200, critical: 500 },
	database: { warning: 100, critical: 300 },
	socket: { warning: 50, critical: 150 },
	frontend: { warning: 1000, critical: 3000 }
};

export const getServerMetrics = async (req, res) => {
	try {
		const startTime = Date.now();
		
		// Collect all metrics in parallel
		const [
			backendMetrics,
			databaseMetrics,
			socketMetrics,
			systemMetrics,
			bugDetection
		] = await Promise.all([
			getBackendMetrics(),
			getDatabaseMetrics(),
			getSocketMetrics(),
			getSystemMetrics(),
			detectBugs()
		]);

		const metrics = {
			timestamp: new Date().toISOString(),
			backend: backendMetrics,
			database: databaseMetrics,
			socket: socketMetrics,
			frontend: getFrontendMetrics(),
			system: systemMetrics,
			bugs: bugDetection,
			collectionTime: Date.now() - startTime
		};

		// Store in history
		metricsHistory.push(metrics);
		if (metricsHistory.length > MAX_HISTORY) {
			metricsHistory.shift();
		}

		res.status(200).json(metrics);
	} catch (err) {
		console.error("Error collecting server metrics:", err);
		res.status(500).json({ error: "Failed to collect metrics" });
	}
};

// Backend Performance Metrics
const getBackendMetrics = async () => {
	const start = Date.now();
	
	try {
		// Test database connection
		await prisma.$queryRaw`SELECT 1`;
		const responseTime = Date.now() - start;
		
		// Get request stats from memory (you can enhance this with actual tracking)
		const status = responseTime < THRESHOLDS.backend.warning ? 'healthy' : 
		              responseTime < THRESHOLDS.backend.critical ? 'warning' : 'critical';
		
		return {
			responseTime,
			status,
			uptime: process.uptime(),
			memoryUsage: process.memoryUsage().heapUsed / 1024 / 1024, // MB
			activeConnections: getActiveConnections(),
			requestsPerMinute: getRequestsPerMinute(),
			errorRate: getErrorRate(),
			trend: calculateTrend('backend.responseTime')
		};
	} catch (err) {
		return {
			responseTime: 0,
			status: 'critical',
			error: err.message
		};
	}
};

// Database Performance Metrics
const getDatabaseMetrics = async () => {
	const start = Date.now();
	
	try {
		// Test query performance
		await prisma.user.count();
		const queryTime = Date.now() - start;
		
		// Get connection pool stats
		const [userCount, messageCount] = await Promise.all([
			prisma.user.count(),
			prisma.message.count()
		]);
		
		const status = queryTime < THRESHOLDS.database.warning ? 'healthy' : 
		              queryTime < THRESHOLDS.database.critical ? 'warning' : 'critical';
		
		return {
			queryTime,
			status,
			connections: 10, // Placeholder - get from Prisma pool
			activeQueries: 0, // Placeholder
			totalUsers: userCount,
			totalMessages: messageCount,
			cacheHitRate: await getCacheHitRate(),
			trend: calculateTrend('database.queryTime')
		};
	} catch (err) {
		return {
			queryTime: 0,
			status: 'critical',
			error: err.message
		};
	}
};

// WebSocket Performance Metrics
const getSocketMetrics = async () => {
	try {
		const { io, userSocketMap } = await import("../lib/socket.js");
		
		const connectedUsers = Object.keys(userSocketMap).length;
		const totalSockets = io?.sockets?.sockets?.size || 0;
		
		// Estimate latency (you can enhance with actual ping/pong)
		const latency = 10 + Math.random() * 20; // Simulated for now
		
		const status = latency < THRESHOLDS.socket.warning ? 'healthy' : 
		              latency < THRESHOLDS.socket.critical ? 'warning' : 'critical';
		
		return {
			latency: Math.round(latency),
			status,
			connectedUsers,
			totalSockets,
			messagesPerSecond: getSocketMessagesPerSecond(),
			reconnections: 0, // Track this in socket.js
			trend: calculateTrend('socket.latency')
		};
	} catch (err) {
		return {
			latency: 0,
			status: 'critical',
			error: err.message
		};
	}
};

// Frontend Performance Metrics (estimated)
const getFrontendMetrics = () => {
	// These would typically come from client-side reporting
	return {
		loadTime: 800 + Math.random() * 400, // Simulated
		status: 'healthy',
		bundleSize: 2.5, // MB
		cacheHitRate: 85,
		trend: 0
	};
};

// System Resource Metrics
const getSystemMetrics = () => {
	const cpus = os.cpus();
	const totalMem = os.totalmem();
	const freeMem = os.freemem();
	const usedMem = totalMem - freeMem;
	
	// Calculate CPU usage
	let totalIdle = 0;
	let totalTick = 0;
	cpus.forEach(cpu => {
		for (const type in cpu.times) {
			totalTick += cpu.times[type];
		}
		totalIdle += cpu.times.idle;
	});
	const cpuUsage = 100 - ~~(100 * totalIdle / totalTick);
	
	return {
		cpu: cpuUsage,
		memory: Math.round((usedMem / totalMem) * 100),
		disk: 45, // Placeholder - would need disk monitoring library
		platform: os.platform(),
		nodeVersion: process.version,
		uptime: os.uptime()
	};
};

// Bug Detection System
const detectBugs = async () => {
	const bugs = [];
	
	try {
		// Check for suspended users with expired suspensions
		const expiredSuspensions = await prisma.user.count({
			where: {
				isSuspended: true,
				suspensionEndTime: {
					lt: new Date()
				}
			}
		});
		
		if (expiredSuspensions > 0) {
			bugs.push({
				severity: 'medium',
				title: 'Expired Suspensions Not Cleared',
				description: `${expiredSuspensions} users have expired suspensions that haven't been automatically cleared`,
				location: 'Database - User Table',
				timestamp: new Date().toISOString()
			});
		}
		
		// Check for orphaned messages (messages where sender or receiver user doesn't exist)
		// This is a more complex check, so we'll skip it for now to avoid performance issues
		// You can implement this with a raw SQL query if needed
		
		// Check memory usage
		const memUsage = process.memoryUsage().heapUsed / 1024 / 1024;
		if (memUsage > 500) {
			bugs.push({
				severity: 'high',
				title: 'High Memory Usage',
				description: `Backend process using ${memUsage.toFixed(2)}MB of memory`,
				location: 'Backend Server',
				timestamp: new Date().toISOString()
			});
		}
		
		// Check for pending reports older than 7 days
		const oldReports = await prisma.report.count({
			where: {
				status: 'pending',
				createdAt: {
					lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
				}
			}
		});
		
		if (oldReports > 0) {
			bugs.push({
				severity: 'medium',
				title: 'Stale Reports',
				description: `${oldReports} reports have been pending for over 7 days`,
				location: 'Admin Panel - Reports',
				timestamp: new Date().toISOString()
			});
		}
		
		// Check Redis connection
		if (redisClient) {
			try {
				await redisClient.ping();
			} catch (err) {
				bugs.push({
					severity: 'critical',
					title: 'Redis Connection Failed',
					description: 'Unable to connect to Redis cache server',
					location: 'Cache Layer',
					timestamp: new Date().toISOString()
				});
			}
		}
		
	} catch (err) {
		console.error("Error in bug detection:", err);
	}
	
	return bugs;
};

// Helper Functions
const getActiveConnections = () => {
	// Track this in your middleware
	return Math.floor(Math.random() * 50) + 10; // Placeholder
};

const getRequestsPerMinute = () => {
	// Track this in your middleware
	return Math.floor(Math.random() * 100) + 50; // Placeholder
};

const getErrorRate = () => {
	// Track this in your error handler
	return (Math.random() * 2).toFixed(2); // Placeholder
};

const getSocketMessagesPerSecond = () => {
	// Track this in socket.js
	return Math.floor(Math.random() * 20) + 5; // Placeholder
};

const getCacheHitRate = async () => {
	// Track this in Redis operations
	return 85 + Math.random() * 10; // Placeholder
};

const calculateTrend = (metricPath) => {
	if (metricsHistory.length < 2) return 0;
	
	const recent = metricsHistory.slice(-10);
	const values = recent.map(m => getNestedValue(m, metricPath)).filter(v => v != null);
	
	if (values.length < 2) return 0;
	
	const avg1 = values.slice(0, Math.floor(values.length / 2)).reduce((a, b) => a + b, 0) / Math.floor(values.length / 2);
	const avg2 = values.slice(Math.floor(values.length / 2)).reduce((a, b) => a + b, 0) / (values.length - Math.floor(values.length / 2));
	
	return avg2 - avg1;
};

const getNestedValue = (obj, path) => {
	return path.split('.').reduce((acc, part) => acc?.[part], obj);
};

export const getMetricsHistory = async (req, res) => {
	try {
		const limit = parseInt(req.query.limit) || 30;
		res.status(200).json(metricsHistory.slice(-limit));
	} catch (err) {
		res.status(500).json({ error: "Failed to fetch metrics history" });
	}
};

export const clearMetricsHistory = async (req, res) => {
	try {
		metricsHistory.length = 0;
		res.status(200).json({ message: "Metrics history cleared" });
	} catch (err) {
		res.status(500).json({ error: "Failed to clear metrics history" });
	}
};
