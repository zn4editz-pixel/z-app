#!/usr/bin/env node
/**
 * System Health Check Script
 * Tests all critical components before deployment
 */

import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';
import { config } from 'dotenv';

config({ path: './backend/.env' });

const prisma = new PrismaClient();
let redis;

const tests = {
  passed: 0,
  failed: 0,
  results: []
};

function log(emoji, message, status = 'info') {
  const colors = {
    success: '\x1b[32m',
    error: '\x1b[31m',
    info: '\x1b[36m',
    reset: '\x1b[0m'
  };
  console.log(`${emoji} ${colors[status]}${message}${colors.reset}`);
}

async function testDatabase() {
  try {
    log('🔍', 'Testing PostgreSQL connection...', 'info');
    await prisma.$connect();
    
    const userCount = await prisma.user.count();
    log('✅', `Database connected! Found ${userCount} users`, 'success');
    tests.passed++;
    tests.results.push({ test: 'Database', status: 'PASS' });
    return true;
  } catch (error) {
    log('❌', `Database connection failed: ${error.message}`, 'error');
    tests.failed++;
    tests.results.push({ test: 'Database', status: 'FAIL', error: error.message });
    return false;
  }
}

async function testRedis() {
  try {
    log('🔍', 'Testing Redis connection...', 'info');
    
    if (!process.env.REDIS_URL) {
      log('⚠️', 'Redis URL not configured (optional)', 'info');
      tests.results.push({ test: 'Redis', status: 'SKIP' });
      return true;
    }

    redis = new Redis(process.env.REDIS_URL);
    await redis.ping();
    
    // Test set/get
    await redis.set('test:health', 'ok', 'EX', 10);
    const value = await redis.get('test:health');
    
    if (value === 'ok') {
      log('✅', 'Redis connected and working!', 'success');
      tests.passed++;
      tests.results.push({ test: 'Redis', status: 'PASS' });
      return true;
    }
  } catch (error) {
    log('⚠️', `Redis connection failed: ${error.message}`, 'error');
    log('ℹ️', 'Redis is optional but recommended for production', 'info');
    tests.results.push({ test: 'Redis', status: 'WARN', error: error.message });
    return true; // Non-critical
  }
}

async function testPrismaSchema() {
  try {
    log('🔍', 'Testing Prisma schema...', 'info');
    
    // Test all models
    const [users, messages, reports, notifications] = await Promise.all([
      prisma.user.findMany({ take: 1 }),
      prisma.message.findMany({ take: 1 }),
      prisma.report.findMany({ take: 1 }),
      prisma.adminNotification.findMany({ take: 1 })
    ]);
    
    log('✅', 'All Prisma models accessible!', 'success');
    tests.passed++;
    tests.results.push({ test: 'Prisma Schema', status: 'PASS' });
    return true;
  } catch (error) {
    log('❌', `Prisma schema error: ${error.message}`, 'error');
    tests.failed++;
    tests.results.push({ test: 'Prisma Schema', status: 'FAIL', error: error.message });
    return false;
  }
}

async function testEnvironmentVariables() {
  try {
    log('🔍', 'Checking environment variables...', 'info');
    
    const required = [
      'DATABASE_URL',
      'JWT_SECRET',
      'CLOUDINARY_CLOUD_NAME',
      'CLOUDINARY_API_KEY',
      'CLOUDINARY_API_SECRET'
    ];
    
    const missing = required.filter(key => !process.env[key]);
    
    if (missing.length > 0) {
      log('❌', `Missing required env vars: ${missing.join(', ')}`, 'error');
      tests.failed++;
      tests.results.push({ test: 'Environment', status: 'FAIL', error: `Missing: ${missing.join(', ')}` });
      return false;
    }
    
    log('✅', 'All required environment variables present!', 'success');
    tests.passed++;
    tests.results.push({ test: 'Environment', status: 'PASS' });
    return true;
  } catch (error) {
    log('❌', `Environment check failed: ${error.message}`, 'error');
    tests.failed++;
    tests.results.push({ test: 'Environment', status: 'FAIL', error: error.message });
    return false;
  }
}

async function runAllTests() {
  console.log('\n🚀 Z-APP System Health Check\n');
  console.log('═'.repeat(50));
  
  await testEnvironmentVariables();
  await testDatabase();
  await testRedis();
  await testPrismaSchema();
  
  console.log('\n' + '═'.repeat(50));
  console.log('\n📊 Test Results:\n');
  
  tests.results.forEach(result => {
    const emoji = result.status === 'PASS' ? '✅' : 
                  result.status === 'FAIL' ? '❌' : 
                  result.status === 'SKIP' ? '⏭️' : '⚠️';
    console.log(`${emoji} ${result.test}: ${result.status}`);
    if (result.error) {
      console.log(`   └─ ${result.error}`);
    }
  });
  
  console.log(`\n✅ Passed: ${tests.passed}`);
  console.log(`❌ Failed: ${tests.failed}`);
  
  if (tests.failed === 0) {
    log('\n🎉', 'All critical tests passed! System ready for deployment!', 'success');
    process.exit(0);
  } else {
    log('\n⚠️', 'Some tests failed. Please fix issues before deploying.', 'error');
    process.exit(1);
  }
}

// Cleanup
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  if (redis) await redis.quit();
  process.exit(0);
});

// Run tests
runAllTests().catch(async (error) => {
  log('💥', `Fatal error: ${error.message}`, 'error');
  await prisma.$disconnect();
  if (redis) await redis.quit();
  process.exit(1);
});
