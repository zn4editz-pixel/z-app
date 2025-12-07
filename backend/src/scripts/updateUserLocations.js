/**
 * Migration Script: Update existing users with location data
 * Run this once to populate location data for existing users
 * 
 * Usage: node src/scripts/updateUserLocations.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/user.model.js';
import { getLocationData } from '../utils/geoLocation.js';

dotenv.config();

const updateUserLocations = async () => {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get all users without location data
    const users = await User.find({
      $or: [
        { country: { $exists: false } },
        { country: 'Unknown' },
        { country: null }
      ]
    });

    console.log(`📊 Found ${users.length} users without location data`);

    if (users.length === 0) {
      console.log('✅ All users already have location data!');
      process.exit(0);
    }

    let updated = 0;
    let failed = 0;

    for (const user of users) {
      try {
        // Use last known IP or skip if not available
        const ip = user.lastIP || '8.8.8.8'; // Default to Google DNS for demo
        
        console.log(`🔍 Updating location for ${user.username} (IP: ${ip})...`);
        
        const locationData = await getLocationData(ip);
        
        user.country = locationData.country;
        user.countryCode = locationData.countryCode;
        user.city = locationData.city;
        user.region = locationData.region || '';
        user.timezone = locationData.timezone || '';
        user.isVPN = locationData.isVPN || false;
        
        await user.save();
        
        console.log(`✅ Updated ${user.username}: ${locationData.city}, ${locationData.country}`);
        updated++;
        
        // Add delay to avoid hitting API rate limits (1000 requests/day)
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`❌ Failed to update ${user.username}:`, error.message);
        failed++;
      }
    }

    console.log('\n📊 Migration Summary:');
    console.log(`✅ Successfully updated: ${updated} users`);
    console.log(`❌ Failed: ${failed} users`);
    console.log(`📍 Total processed: ${users.length} users`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
};

// Run the migration
updateUserLocations();
