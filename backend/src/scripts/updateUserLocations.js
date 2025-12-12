/**
 * Migration Script: Update existing users with location data
 * Run this once to populate location data for existing users
 * 
 * Usage: node src/scripts/updateUserLocations.js
 */

import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import { getLocationData } from '../utils/geoLocation.js';

dotenv.config();

const prisma = new PrismaClient();

const updateUserLocations = async () => {
  try {
    console.log('🔄 Connecting to database...');
    
    // Get all users without location data or with 'Unknown' country
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { country: null },
          { country: 'Unknown' },
          { country: '' },
          { countryCode: null },
          { countryCode: 'XX' }
        ]
      },
      select: {
        id: true,
        username: true,
        lastIP: true,
        country: true,
        city: true
      }
    });

    console.log(`📊 Found ${users.length} users without proper location data`);

    if (users.length === 0) {
      console.log('✅ All users already have location data!');
      await prisma.$disconnect();
      process.exit(0);
    }

    let updated = 0;
    let failed = 0;

    for (const user of users) {
      try {
        // Use last known IP or use a default IP for testing
        let ip = user.lastIP;
        
        // If no IP available, try to get a sample IP based on existing data
        if (!ip || ip === '127.0.0.1' || ip === '::1') {
          // Use different sample IPs for testing
          const sampleIPs = [
            '8.8.8.8',      // Google DNS (US)
            '1.1.1.1',      // Cloudflare (US)
            '208.67.222.222', // OpenDNS (US)
            '134.195.196.26'  // Sample IP
          ];
          ip = sampleIPs[Math.floor(Math.random() * sampleIPs.length)];
        }
        
        console.log(`🔍 Updating location for ${user.username} (IP: ${ip})...`);
        
        const locationData = await getLocationData(ip);
        
        // Only update if we got valid location data
        if (locationData.country && locationData.country !== 'Unknown') {
          await prisma.user.update({
            where: { id: user.id },
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
          
          console.log(`✅ Updated ${user.username}: ${locationData.city}, ${locationData.country}`);
          updated++;
        } else {
          console.warn(`⚠️ No valid location data for ${user.username}, skipping...`);
          failed++;
        }
        
        // Add delay to avoid hitting API rate limits
        await new Promise(resolve => setTimeout(resolve, 200));
        
      } catch (error) {
        console.error(`❌ Failed to update ${user.username}:`, error.message);
        failed++;
      }
    }

    console.log('\n📊 Migration Summary:');
    console.log(`✅ Successfully updated: ${updated} users`);
    console.log(`❌ Failed: ${failed} users`);
    console.log(`📍 Total processed: ${users.length} users`);

    await prisma.$disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
};

// Run the migration
updateUserLocations();
