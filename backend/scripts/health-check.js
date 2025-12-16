import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..'); // Assuming scripts is in backend/scripts or root/scripts

console.log('🔍 Starting Comprehensive Project Health Check...\n');

let issues = [];

// 1. Check .env
const envPath = path.join(rootDir, '.env');
if (fs.existsSync(envPath)) {
    console.log('✅ .env file found');
    const envContent = fs.readFileSync(envPath, 'utf8');
    if (!envContent.includes('DATABASE_URL="file:./dev.db"')) {
        issues.push('⚠️ .env DATABASE_URL might not be pointing to SQLite (file:./dev.db)');
    }
    if (!envContent.includes('PORT=5002')) {
        issues.push('⚠️ .env PORT might not be 5002 (Consistency check)');
    }
} else {
    issues.push('❌ .env file MISSING');
}

// 2. Check Database
const dbPath = path.join(rootDir, 'dev.db');
if (fs.existsSync(dbPath)) {
    console.log('✅ SQLite database file exists (dev.db)');
} else {
    // It's okay if it doesn't exist yet if prisma generate hasn't run, but worth noting
    console.log('ℹ️ dev.db not found (Prisma will create it on first run)');
}

// 3. Check Prisma Client
try {
    // Check if @prisma/client is in node_modules
    const prismaClientPath = path.join(rootDir, 'node_modules', '.prisma', 'client');
    if (fs.existsSync(prismaClientPath)) {
        console.log('✅ Prisma Client found in node_modules');
    } else {
        issues.push('❌ Prisma Client NOT found. Run "npx prisma generate"');
    }
} catch (e) {
    issues.push('❌ Error checking Prisma Client: ' + e.message);
}

// 4. Report
console.log('\n--- Analysis Report ---');
if (issues.length === 0) {
    console.log('🎉 GREAT! No critical issues found. Your environment looks stable.');
    console.log('👉 Tip: If you still have issues, try deleting "node_modules" and running "npm install".');
} else {
    console.log('⚠️ Found ' + issues.length + ' potential issues:');
    issues.forEach(issue => console.log('  ' + issue));
}
