import express from 'express';
import {
	getSystemHealth,
	getProcessInfo,
	getDatabaseHealth,
	getWebRTCStats,
	getSocketStats,
	getRedisStats,
	getAPIStats,
	getNetworkStats,
	getLogs,
	executeAction
} from '../controllers/health.controller.js';
import { protectRoute } from '../middleware/auth.middleware.js';

const router = express.Router();

// Public health check endpoint
router.get('/ping', async (req, res) => {
	try {
		// Test database connection
		const { ConnectionMonitor } = await import('../lib/db.js');
		const dbHealth = await ConnectionMonitor.checkHealth();
		res.json({
			status: 'ok',
			timestamp: new Date().toISOString(),
			database: dbHealth.database || 'unknown'
		});
	} catch (error) {
		res.json({
			status: 'ok',
			timestamp: new Date().toISOString(),
			database: 'error',
			error: error.message
		});
	}
});

// Environment diagnostics endpoint
router.get('/env', (req, res) => {
	const envCheck = {
		NODE_ENV: process.env.NODE_ENV || 'not set',
		PORT: process.env.PORT || 'not set',
		DATABASE_URL: process.env.DATABASE_URL ? 'set' : 'not set',
		JWT_SECRET: process.env.JWT_SECRET ? 'set' : 'not set',
		CLIENT_URL: process.env.CLIENT_URL || 'not set',
		FRONTEND_URL: process.env.FRONTEND_URL || 'not set',
		RENDER: process.env.RENDER || 'not set',
		timestamp: new Date().toISOString()
	};
	res.json(envCheck);
});

// Comprehensive health check
router.get('/', async (req, res) => {
	try {
		// Test database connection
		const { ConnectionMonitor } = await import('../lib/db.js');
		const dbHealth = await ConnectionMonitor.checkHealth();

		const healthStatus = {
			status: dbHealth.database === 'healthy' ? 'healthy' : 'degraded',
			service: 'z-app-backend',
			version: '2.0.0',
			environment: process.env.NODE_ENV || 'development',
			timestamp: new Date().toISOString(),
			checks: {
				database: dbHealth.database,
				memory: process.memoryUsage(),
				uptime: process.uptime()
			}
		};

		const statusCode = healthStatus.status === 'healthy' ? 200 : 503;
		res.status(statusCode).json(healthStatus);
	} catch (error) {
		res.status(503).json({
			status: 'unhealthy',
			service: 'z-app-backend',
			version: '2.0.0',
			environment: process.env.NODE_ENV || 'development',
			timestamp: new Date().toISOString(),
			error: error.message
		});
	}
});

// Protected admin endpoints
router.get('/system', protectRoute, getSystemHealth);
router.get('/process', protectRoute, getProcessInfo);
router.get('/database', protectRoute, getDatabaseHealth);
router.get('/webrtc', protectRoute, getWebRTCStats);
router.get('/socket', protectRoute, getSocketStats);
router.get('/redis', protectRoute, getRedisStats);
router.get('/api', protectRoute, getAPIStats);
router.get('/network', protectRoute, getNetworkStats);
router.get('/logs', protectRoute, getLogs);
router.post('/action', protectRoute, executeAction);

export default router;