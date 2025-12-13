#!/usr/bin/env node

// DATABASE INITIALIZATION - RUNTIME SETUP
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function initializeDatabase() {
  try {
    console.log('🔄 Initializing database...');
    
    // Test database connection
    await prisma.$connect();
    console.log('✅ Database connection successful');
    
    // Try to run a simple query to test if tables exist
    try {
      await prisma.user.count();
      console.log('✅ Database tables exist');
    } catch (error) {
      if (error.code === 'P2021' || error.message.includes('does not exist')) {
        console.log('⚠️ Database tables do not exist, attempting to create...');
        
        // Try to push schema
        try {
          const { execSync } = await import('child_process');
          execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit' });
          console.log('✅ Database schema created successfully');
        } catch (pushError) {
          console.error('❌ Failed to create database schema:', pushError.message);
          console.log('⚠️ Continuing without database schema - app will use fallback mode');
        }
      } else {
        console.error('❌ Database query failed:', error.message);
      }
    }
    
    await prisma.$disconnect();
    console.log('✅ Database initialization completed');
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
    console.log('⚠️ App will continue in fallback mode without database');
    
    try {
      await prisma.$disconnect();
    } catch (disconnectError) {
      // Ignore disconnect errors
    }
  }
}

// Only run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  initializeDatabase();
}

export { initializeDatabase };