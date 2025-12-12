import express from 'express';

const router = express.Router();

// Simple health check endpoint (no Redis dependencies)
router.get('/ping', (req, res) => {
	res.json({ 
		status: 'ok', 
		timestamp: new Date().toISOString(),
		uptime: process.uptime(),
		memory: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB'
	});
});

// Basic health endpoint
router.get('/', (req, res) => {
	res.json({ 
		status: 'healthy',
		service: 'z-app-backend',
		version: '2.0.0',
		environment: process.env.NODE_ENV || 'development'
	});
});

export default router;