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
router.get('/ping', (req, res) => {
	res.json({ status: 'ok', timestamp: new Date().toISOString() });
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
