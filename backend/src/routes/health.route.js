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

// Basic info at /
router.get('/', (req, res) => {
	res.json({
		status: 'healthy',
		service: 'z-app-backend',
		version: '2.0.0',
		environment: process.env.NODE_ENV || 'development'
	});
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
