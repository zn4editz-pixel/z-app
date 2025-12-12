// 📊 ANALYTICS ROUTES
import express from 'express';
import { protectRoute, isAdmin } from '../middleware/protectRoute.js';
import {
    getUserGrowth,
    getMessageStats,
    getDeviceStats,
    getLocationStats,
    getRealTimeMetrics,
    getDashboardOverview
} from '../controllers/analytics.controller.js';

const router = express.Router();

// All analytics routes require admin access
router.use(protectRoute);
router.use(isAdmin);

// 📈 User Growth Analytics
router.get('/user-growth', getUserGrowth);

// 💬 Message Statistics
router.get('/message-stats', getMessageStats);

// 📱 Device Statistics
router.get('/device-stats', getDeviceStats);

// 🌍 Location Statistics
router.get('/location-stats', getLocationStats);

// ⚡ Real-time Metrics
router.get('/realtime', getRealTimeMetrics);

// 📊 Dashboard Overview
router.get('/overview', getDashboardOverview);

export default router;