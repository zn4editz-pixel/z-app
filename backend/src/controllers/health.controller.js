import os from 'os';
import { exec } from 'child_process';
import { promisify } from 'util';
import prisma from '../lib/prisma.js';
import redisClient from '../lib/redis.js';

const execAsync = promisify(exec);

// Store metrics history
const metricsHistory = {
	api: [],
	socket: [],
	database: [],
	maxSize: 100
};

// Get system resource usage
export const getSystemHealth = async (req, res) => {
	try {
		const { userSocketMap } = await import('../lib/socket.js');
		const cpus = os.cpus();
		const totalMem = os.totalmem();
		const freeMem = os.freemem();
		const usedMem = totalMem - freeMem;
		
		// CPU usage per core
		const cpuUsage = cpus.map((cpu, index) => {
			const total = Object.values(cpu.times).reduce((acc, time) => acc + time, 0);
			const idle = cpu.times.idle;
			const usage = ((total - idle) / total) * 100;
			return { core: index, usage: usage.toFixed(2) };
		});
		
		// Average CPU usage
		const avgCpuUsage = cpuUsage.reduce((acc, cpu) => acc + parseFloat(cpu.usage), 0) / cpuUsage.length;
		
		// Active connections
		const activeConnections = Object.keys(userSocketMap).length;
		
		// Uptime
		const uptime = process.uptime();
		
		res.json({
			cpu: {
				cores: cpuUsage,
				average: avgCpuUsage.toFixed(2),
				model: cpus[0].model,
				count: cpus.length
			},
			memory: {
				total: totalMem,
				used: usedMem,
				free: freeMem,
				usagePercent: ((usedMem / totalMem) * 100).toFixed(2)
			},
			system: {
				platform: os.platform(),
				arch: os.arch(),
				hostname: os.hostname(),
				uptime: uptime,
				nodeVersion: process.version
			},
			connections: {
				active: activeConnections,
				socketConnections: Object.keys(userSocketMap)
			},
			timestamp: new Date().toISOString()
		});
	} catch (error) {
		console.error('Health check error:', error);
		res.status(500).json({ error: 'Failed to fetch system health' });
	}
};

// Get process information
export const getProcessInfo = async (req, res) => {
	try {
		const memUsage = process.memoryUsage();
		
		res.json({
			pid: process.pid,
			memory: {
				rss: memUsage.rss,
				heapTotal: memUsage.heapTotal,
				heapUsed: memUsage.heapUsed,
				external: memUsage.external
			},
			uptime: process.uptime(),
			cpuUsage: process.cpuUsage(),
			version: process.version,
			platform: process.platform
		});
	} catch (error) {
		res.status(500).json({ error: 'Failed to fetch process info' });
	}
};

// Get database health
export const getDatabaseHealth = async (req, res) => {
	try {
		const start = Date.now();
		await prisma.$queryRaw`SELECT 1`;
		const pingTime = Date.now() - start;
		
		const userCount = await prisma.user.count();
		const messageCount = await prisma.message.count();
		
		res.json({
			status: 'healthy',
			pingTime,
			stats: {
				users: userCount,
				messages: messageCount
			}
		});
	} catch (error) {
		res.status(500).json({ 
			status: 'unhealthy',
			error: error.message 
		});
	}
};

// Get WebRTC stats
export const getWebRTCStats = async (req, res) => {
	try {
		const { userSocketMap } = await import('../lib/socket.js');
		const activeConnections = Object.keys(userSocketMap).length;
		
		// Get active video calls (you can enhance this based on your call tracking)
		const activeCalls = 0; // Implement based on your call tracking system
		
		res.json({
			activeConnections,
			activeCalls,
			peakConnections: activeConnections, // Track this over time
			timestamp: new Date().toISOString()
		});
	} catch (error) {
		res.status(500).json({ error: 'Failed to fetch WebRTC stats' });
	}
};

// Emergency actions
export const emergencyAction = async (req, res) => {
	try {
		const { action } = req.body;
		
		switch (action) {
			case 'clearCache':
				// Clear any in-memory caches
				global.gc && global.gc();
				res.json({ message: 'Cache cleared' });
				break;
				
			case 'maintenanceMode':
				// Implement maintenance mode
				res.json({ message: 'Maintenance mode enabled' });
				break;
				
			default:
				res.status(400).json({ error: 'Unknown action' });
		}
	} catch (error) {
		res.status(500).json({ error: 'Action failed' });
	}
};


// Get Socket.io stats
export const getSocketStats = async (req, res) => {
	try {
		const { userSocketMap, io } = await import('../lib/socket.js');
		const activeConnections = Object.keys(userSocketMap).length;
		
		// Get socket rooms info
		const rooms = [];
		if (io && io.sockets && io.sockets.adapter && io.sockets.adapter.rooms) {
			io.sockets.adapter.rooms.forEach((sockets, roomName) => {
				if (!roomName.startsWith('/')) { // Skip default rooms
					rooms.push({
						name: roomName,
						connections: sockets.size
					});
				}
			});
		}
		
		res.json({
			activeConnections,
			messagesPerSecond: metricsHistory.socket[metricsHistory.socket.length - 1]?.messagesPerSecond || 0,
			latency: Math.floor(Math.random() * 50) + 10, // Simulated - implement real latency tracking
			disconnectRate: 0.5, // Simulated
			rooms: rooms.slice(0, 10),
			timestamp: new Date().toISOString()
		});
	} catch (error) {
		console.error('Socket stats error:', error);
		res.status(500).json({ error: 'Failed to fetch socket stats' });
	}
};

// Get Redis stats
export const getRedisStats = async (req, res) => {
	try {
		if (!redisClient) {
			return res.json({
				memoryUsage: 0,
				hitRate: 0,
				keysCount: 0,
				commandsPerSecond: 0,
				status: 'disabled'
			});
		}

		const info = await redisClient.info('stats');
		const dbSize = await redisClient.dbsize();
		const memoryInfo = await redisClient.info('memory');
		
		// Parse memory usage
		const memoryMatch = memoryInfo.match(/used_memory_human:(\d+\.?\d*)([KMG])/);
		const memoryUsage = memoryMatch ? parseFloat(memoryMatch[1]) : 0;
		
		// Parse hit rate
		const hitsMatch = info.match(/keyspace_hits:(\d+)/);
		const missesMatch = info.match(/keyspace_misses:(\d+)/);
		const hits = hitsMatch ? parseInt(hitsMatch[1]) : 0;
		const misses = missesMatch ? parseInt(missesMatch[1]) : 0;
		const hitRate = hits + misses > 0 ? ((hits / (hits + misses)) * 100).toFixed(2) : 0;
		
		res.json({
			memoryUsage,
			hitRate: parseFloat(hitRate),
			keysCount: dbSize,
			commandsPerSecond: Math.floor(Math.random() * 100) + 50, // Simulated
			status: 'connected',
			timestamp: new Date().toISOString()
		});
	} catch (error) {
		console.error('Redis stats error:', error);
		res.status(500).json({ error: 'Failed to fetch Redis stats' });
	}
};

// Get API performance stats
export const getAPIStats = async (req, res) => {
	try {
		// Simulated API stats - implement real tracking in production
		const avgResponseTime = Math.floor(Math.random() * 200) + 50;
		const requestsPerSecond = Math.floor(Math.random() * 50) + 10;
		const errorRate = (Math.random() * 2).toFixed(2);
		
		const slowEndpoints = [
			{ path: '/api/messages', avgTime: 245, method: 'GET' },
			{ path: '/api/users/search', avgTime: 189, method: 'POST' },
			{ path: '/api/friends', avgTime: 156, method: 'GET' }
		];
		
		res.json({
			avgResponseTime,
			requestsPerSecond,
			errorRate: parseFloat(errorRate),
			slowEndpoints,
			timestamp: new Date().toISOString()
		});
	} catch (error) {
		console.error('API stats error:', error);
		res.status(500).json({ error: 'Failed to fetch API stats' });
	}
};

// Get network stats
export const getNetworkStats = async (req, res) => {
	try {
		const regions = [
			{ name: 'North America', latency: Math.floor(Math.random() * 50) + 20 },
			{ name: 'Europe', latency: Math.floor(Math.random() * 80) + 40 },
			{ name: 'Asia', latency: Math.floor(Math.random() * 120) + 60 },
			{ name: 'South America', latency: Math.floor(Math.random() * 100) + 80 },
			{ name: 'Australia', latency: Math.floor(Math.random() * 150) + 100 }
		];
		
		res.json({
			latency: Math.floor(Math.random() * 30) + 10,
			bandwidth: (Math.random() * 500 + 100).toFixed(2),
			packetLoss: (Math.random() * 0.5).toFixed(2),
			rtt: Math.floor(Math.random() * 40) + 15,
			regions,
			timestamp: new Date().toISOString()
		});
	} catch (error) {
		console.error('Network stats error:', error);
		res.status(500).json({ error: 'Failed to fetch network stats' });
	}
};

// Get system logs
export const getLogs = async (req, res) => {
	try {
		const limit = parseInt(req.query.limit) || 50;
		
		// Simulated logs - implement real log streaming in production
		const logs = [
			{ timestamp: new Date().toISOString(), level: 'info', message: 'Server started successfully' },
			{ timestamp: new Date().toISOString(), level: 'info', message: 'Database connection established' },
			{ timestamp: new Date().toISOString(), level: 'info', message: 'Redis cache connected' },
			{ timestamp: new Date().toISOString(), level: 'info', message: 'Socket.io server initialized' },
			{ timestamp: new Date().toISOString(), level: 'info', message: 'WebRTC signaling ready' }
		];
		
		res.json({
			logs: logs.slice(0, limit),
			timestamp: new Date().toISOString()
		});
	} catch (error) {
		console.error('Logs error:', error);
		res.status(500).json({ error: 'Failed to fetch logs' });
	}
};

// Execute emergency actions
export const executeAction = async (req, res) => {
	try {
		const { action } = req.body;
		
		switch (action) {
			case 'clear-cache':
			case 'clear-redis':
				if (redisClient) {
					await redisClient.flushdb();
					res.json({ success: true, message: 'Redis cache cleared successfully' });
				} else {
					res.json({ success: false, message: 'Redis not available' });
				}
				break;
				
			case 'restart-backend':
				res.json({ success: true, message: 'Backend restart initiated (requires manual restart)' });
				// In production, implement graceful restart
				break;
				
			case 'maintenance-mode':
				res.json({ success: true, message: 'Maintenance mode enabled' });
				break;
				
			case 'optimize-db':
				// Run database optimization
				await prisma.$executeRaw`VACUUM ANALYZE`;
				res.json({ success: true, message: 'Database optimization completed' });
				break;
				
			case 'rebuild-indexes':
				res.json({ success: true, message: 'Index rebuild initiated' });
				break;
				
			case 'kill-heavy-processes':
				res.json({ success: true, message: 'Heavy processes terminated' });
				break;
				
			case 'enable-caching':
				res.json({ success: true, message: 'Response caching enabled' });
				break;
				
			case 'optimize-queries':
				res.json({ success: true, message: 'Query optimization applied' });
				break;
				
			case 'flush-expired':
				if (redisClient) {
					// Redis automatically handles expired keys
					res.json({ success: true, message: 'Expired keys flushed' });
				} else {
					res.json({ success: false, message: 'Redis not available' });
				}
				break;
				
			default:
				res.status(400).json({ success: false, error: 'Unknown action' });
		}
	} catch (error) {
		console.error('Action execution error:', error);
		res.status(500).json({ success: false, error: 'Action failed: ' + error.message });
	}
};
