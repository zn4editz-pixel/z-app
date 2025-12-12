// 🌍 LOCATION ROUTES - For testing and manual updates
import express from 'express';
import { PrismaClient } from '@prisma/client';
import { protectRoute } from '../middleware/protectRoute.js';
import { forceLocationUpdate, getLocationStats } from '../middleware/locationDetector.js';
import { getLocationData, getClientIP } from '../utils/geoLocation.js';

const prisma = new PrismaClient();

const router = express.Router();

// Get current user's location info
router.get('/me', protectRoute, async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            select: {
                country: true,
                countryCode: true,
                city: true,
                region: true,
                timezone: true,
                lastIP: true,
                isVPN: true
            }
        });

        res.json({
            location: user,
            currentIP: getClientIP(req)
        });
    } catch (error) {
        console.error('Get user location error:', error);
        res.status(500).json({ error: 'Failed to get location data' });
    }
});

// Force update current user's location
router.post('/update', protectRoute, async (req, res) => {
    try {
        const clientIP = getClientIP(req);
        console.log(`🔄 Manual location update requested for user ${req.user.id} from IP: ${clientIP}`);
        
        const updatedUser = await forceLocationUpdate(req.user.id, clientIP);
        
        if (updatedUser) {
            res.json({
                message: 'Location updated successfully',
                location: {
                    country: updatedUser.country,
                    countryCode: updatedUser.countryCode,
                    city: updatedUser.city,
                    region: updatedUser.region,
                    timezone: updatedUser.timezone,
                    ip: clientIP
                }
            });
        } else {
            res.status(400).json({ error: 'Failed to detect location from current IP' });
        }
    } catch (error) {
        console.error('Force location update error:', error);
        res.status(500).json({ error: 'Failed to update location' });
    }
});

// Test geolocation API directly
router.get('/test/:ip?', protectRoute, async (req, res) => {
    try {
        const testIP = req.params.ip || getClientIP(req);
        console.log(`🧪 Testing geolocation for IP: ${testIP}`);
        
        const locationData = await getLocationData(testIP);
        
        res.json({
            ip: testIP,
            locationData,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Location test error:', error);
        res.status(500).json({ error: 'Failed to test location detection' });
    }
});

// Get location statistics (for debugging)
router.get('/stats', protectRoute, async (req, res) => {
    try {
        const stats = await getLocationStats();
        res.json(stats);
    } catch (error) {
        console.error('Location stats error:', error);
        res.status(500).json({ error: 'Failed to get location statistics' });
    }
});

export default router;