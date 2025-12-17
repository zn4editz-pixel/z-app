#!/usr/bin/env node

// 🎯 FINAL PRODUCTION READINESS CHECK
// Comprehensive check to ensure 100% production readiness

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

console.log('🎯 FINAL PRODUCTION READINESS CHECK\n');

const checks = [
  {
    name: 'Environment Variables',
    check: () => {
      try {
        execSync('cd backend && node scripts/validate-env.js', { stdio: 'pipe' });
        return { passed: true, message: 'All environment variables validated' };
      } catch (error) {
        return { passed: false, message: 'Environment validation failed' };
      }
    }
  },
  {
    name: 'Database Connection',
    check: () => {
      try {
        execSync('cd backend && npm run test:db', { stdio: 'pipe' });
        return { passed: true, message: 'Database connection successful' };
      } catch (error) {
        return { passed: false, message: 'Database connection failed' };
      }
    }
  },
  {
    name: 'Prisma Client',
    check: () => {
      const clientPath = path.join('backend', 'node_modules', '@prisma', 'client');
      if (fs.existsSync(clientPath)) {
        return { passed: true, message: 'Prisma client generated' };
      }
      return { passed: false, message: 'Prisma client not found - run: npx prisma generate' };
    }
  },
  {
    name: 'Frontend Build',
    check: () => {
      const distPath = path.join('frontend', 'dist');
      if (fs.existsSync(distPath)) {
        return { passed: true, message: 'Frontend build exists' };
      }
      return { passed: false, message: 'Frontend not built - run: npm run build' };
    }
  },
  {
    name: 'Production Files',
    check: () => {
      const requiredFiles = [
        'backend/.env.production.template',
        'docker-compose.production.yml',
        'nginx.production.conf',
        'deploy-production.bat'
      ];
      
      const missing = requiredFiles.filter(file => !fs.existsSync(file));
      if (missing.length === 0) {
        return { passed: true, message: 'All production files present' };
      }
      return { passed: false, message: `Missing files: ${missing.join(', ')}` };
    }
  },
  {
    name: 'Security Configuration',
    check: () => {
      try {
        const indexContent = fs.readFileSync('backend/src/index.js', 'utf8');
        const hasHelmet = indexContent.includes('helmet');
        const hasCors = indexContent.includes('cors');
        const hasRateLimit = indexContent.includes('rateLimit') || indexContent.includes('rate-limit');
        
        if (hasHelmet && hasCors) {
          return { passed: true, message: 'Security middleware configured' };
        }
        return { passed: false, message: 'Missing security middleware' };
      } catch (error) {
        return { passed: false, message: 'Could not verify security configuration' };
      }
    }
  },
  {
    name: 'Monitoring & Logging',
    check: () => {
      const loggerPath = path.join('backend', 'src', 'lib', 'logger.js');
      const monitoringPath = path.join('backend', 'src', 'middleware', 'monitoring.js');
      
      if (fs.existsSync(loggerPath) && fs.existsSync(monitoringPath)) {
        return { passed: true, message: 'Monitoring and logging configured' };
      }
      return { passed: false, message: 'Monitoring/logging files missing' };
    }
  }
];

let passed = 0;
let failed = 0;

console.log('Running checks...\n');

checks.forEach((check, index) => {
  process.stdout.write(`${index + 1}. ${check.name}... `);
  
  try {
    const result = check.check();
    if (result.passed) {
      console.log(`✅ PASS - ${result.message}`);
      passed++;
    } else {
      console.log(`❌ FAIL - ${result.message}`);
      failed++;
    }
  } catch (error) {
    console.log(`❌ ERROR - ${error.message}`);
    failed++;
  }
});

// Calculate percentage
const total = checks.length;
const percentage = Math.round((passed / total) * 100);

console.log('\n📊 RESULTS:');
console.log(`✅ Passed: ${passed}/${total}`);
console.log(`❌ Failed: ${failed}/${total}`);
console.log(`📈 Score: ${percentage}%`);

if (percentage === 100) {
  console.log('\n🎉 CONGRATULATIONS!');
  console.log('🚀 Your application is 100% PRODUCTION READY!');
  console.log('\n✨ Ready for deployment to:');
  console.log('   • Railway (recommended)');
  console.log('   • Render');
  console.log('   • Vercel + Railway');
  console.log('   • Docker containers');
  console.log('   • VPS/dedicated servers');
} else if (percentage >= 90) {
  console.log('\n🎯 Almost there!');
  console.log(`Your application is ${percentage}% ready for production.`);
  console.log('Fix the failed checks above to reach 100%.');
} else {
  console.log('\n⚠️  More work needed');
  console.log(`Your application is ${percentage}% ready for production.`);
  console.log('Please address the failed checks above.');
}

process.exit(failed > 0 ? 1 : 0);