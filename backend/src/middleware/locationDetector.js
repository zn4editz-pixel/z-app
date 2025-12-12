/**
 * Location Detection Middleware
 * Automatically detects and updates user location on authenticated requests
 */

import { getLocationData, getClientIP } from '../utils/geoLocation.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Middleware to detect and update user location
 * Only runs for authenticated users and throttles updates
 */
export const locationDetector = async (req, res, next) => {
  try {
    // Only run for authenticated users
    if (!req.user || !req.user.id) {
      return next();
    }

    const userId = req.user.id;
    const clientIP = getClientIP(req);
    
    // Skip if no valid IP
    if (!clientIP || clientIP === '127.0.0.1' || clientIP === '::1') {
      return next();
    }

    // Check if user needs location update
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        lastIP: true,
        country: true,
        updatedAt: true
      }
    });

    if (!user) {
      return next();
    }

    // Determine if we should update location
    const shouldUpdate = 
      !user.country || 
      user.country === 'Unknown' || 
      user.lastIP !== clientIP || 
      (Date.now() - new Date(user.updatedAt).getTime()) > 24 * 60 * 60 * 1000; // 24 hours

    if (shouldUpdate) {
      // Run location detection in background (don't block the request)
      setImmediate(async () => {
        try {
          console.log(`🌍 Updating location for user ${userId} from IP: ${clientIP}`);
          
          const locationData = await getLocationData(clientIP);
          
          // Only update if we got valid data
          if (locationData.country && locationData.country !== 'Unknown') {
            await prisma.user.update({
              where: { id: userId },
              data: {
                country: locationData.country,
                countryCode: locationData.countryCode,
                city: locationData.city,
                region: locationData.region || '',
                timezone: locationData.timezone || '',
                isVPN: locationData.isVPN || false,
                lastIP: clientIP
              }
            });
            
            console.log(`✅ Updated location for user ${userId}: ${locationData.city}, ${locationData.country}`);
          }
        } catch (error) {
          console.error(`❌ Background location update failed for user ${userId}:`, error.message);
        }
      });
    }

    next();
  } catch (error) {
    console.error('Location detector middleware error:', error.message);
    // Don't block the request on location detection errors
    next();
  }
};

/**
 * Force location update for a specific user
 * Can be called from controllers when needed
 */
export const forceLocationUpdate = async (userId, ip = null) => {
  try {
    if (!ip) {
      console.warn('No IP provided for force location update');
      return null;
    }

    console.log(`🔄 Force updating location for user ${userId} from IP: ${ip}`);
    
    const locationData = await getLocationData(ip);
    
    if (locationData.country && locationData.country !== 'Unknown') {
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          country: locationData.country,
          countryCode: locationData.countryCode,
          city: locationData.city,
          region: locationData.region || '',
          timezone: locationData.timezone || '',
          isVPN: locationData.isVPN || false,
          lastIP: ip
        }
      });
      
      console.log(`✅ Force updated location for user ${userId}: ${locationData.city}, ${locationData.country}`);
      return updatedUser;
    }
    
    return null;
  } catch (error) {
    console.error(`❌ Force location update failed for user ${userId}:`, error.message);
    throw error;
  }
};

/**
 * Get location statistics for admin dashboard
 */
export const getLocationStats = async () => {
  try {
    const stats = await prisma.user.groupBy({
      by: ['country'],
      _count: {
        id: true
      },
      where: {
        country: {
          not: null,
          not: 'Unknown'
        }
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      },
      take: 20
    });

    const totalUsers = await prisma.user.count({
      where: {
        country: {
          not: null,
          not: 'Unknown'
        }
      }
    });

    return stats.map(stat => ({
      country: stat.country,
      users: stat._count.id,
      percentage: Math.round((stat._count.id / totalUsers) * 100)
    }));
  } catch (error) {
    console.error('Error getting location stats:', error.message);
    return [];
  }
};