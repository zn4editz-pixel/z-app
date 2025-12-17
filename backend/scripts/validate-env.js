#!/usr/bin/env node

// 🔍 PRODUCTION ENVIRONMENT VALIDATOR
// Validates all required environment variables before deployment

import 'dotenv/config';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const colors = require('colors');

console.log('🔍 Validating Production Environment...'.blue.bold);

const requiredVars = [
  'DATABASE_URL',
  'JWT_SECRET',
  'NODE_ENV',
  'PORT'
];

const recommendedVars = [
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY', 
  'CLOUDINARY_API_SECRET',
  'EMAIL_USER',
  'EMAIL_PASS',
  'FRONTEND_URL',
  'CLIENT_URL',
  'ADMIN_EMAIL',
  'ADMIN_USERNAME'
];

const securityChecks = [
  {
    name: 'JWT_SECRET',
    check: (value) => value && value.length >= 32,
    message: 'JWT_SECRET must be at least 32 characters long'
  },
  {
    name: 'NODE_ENV',
    check: (value) => value === 'production',
    message: 'NODE_ENV should be "production" for production deployment'
  },
  {
    name: 'DATABASE_URL',
    check: (value) => value && (value.includes('postgresql://') || value.includes('postgres://')),
    message: 'DATABASE_URL should use PostgreSQL for production'
  }
];

let errors = 0;
let warnings = 0;

// Check required variables
console.log('\n📋 Required Variables:'.yellow.bold);
requiredVars.forEach(varName => {
  const value = process.env[varName];
  if (!value) {
    console.log(`❌ ${varName}: MISSING`.red);
    errors++;
  } else {
    console.log(`✅ ${varName}: SET`.green);
  }
});

// Check recommended variables
console.log('\n💡 Recommended Variables:'.yellow.bold);
recommendedVars.forEach(varName => {
  const value = process.env[varName];
  if (!value) {
    console.log(`⚠️  ${varName}: NOT SET`.yellow);
    warnings++;
  } else {
    console.log(`✅ ${varName}: SET`.green);
  }
});

// Security checks
console.log('\n🔒 Security Checks:'.yellow.bold);
securityChecks.forEach(check => {
  const value = process.env[check.name];
  if (!check.check(value)) {
    console.log(`❌ ${check.name}: ${check.message}`.red);
    errors++;
  } else {
    console.log(`✅ ${check.name}: SECURE`.green);
  }
});

// Summary
console.log('\n📊 Summary:'.blue.bold);
console.log(`✅ Passed: ${requiredVars.length + securityChecks.length - errors}`.green);
console.log(`❌ Errors: ${errors}`.red);
console.log(`⚠️  Warnings: ${warnings}`.yellow);

if (errors > 0) {
  console.log('\n❌ Environment validation FAILED!'.red.bold);
  console.log('Please fix the errors above before deploying to production.'.red);
  process.exit(1);
} else {
  console.log('\n✅ Environment validation PASSED!'.green.bold);
  console.log('Your application is ready for production deployment.'.green);
  
  if (warnings > 0) {
    console.log(`\n💡 Consider setting the ${warnings} recommended variables for full functionality.`.yellow);
  }
  
  process.exit(0);
}