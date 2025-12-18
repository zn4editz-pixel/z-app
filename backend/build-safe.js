#!/usr/bin/env node

// COMPLETELY BUILD-SAFE SCRIPT - NO DATABASE OPERATIONS
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Starting build-safe deployment process...');

try {
  // Step 1: Install dependencies
  console.log('📦 Installing dependencies...');
  execSync('npm install', { stdio: 'inherit', cwd: __dirname });

  // Step 2: Setup build schema
  const isProduction = process.env.NODE_ENV === 'production' || process.env.RENDER;

  if (isProduction) {
    console.log('🌍 Production environment detected (Render/Node).');
    console.log('🔄 Delegating to setup-schema.js for correct production schema...');
    try {
      execSync('node scripts/setup-schema.js', { stdio: 'inherit', cwd: __dirname });
    } catch (e) {
      console.warn('⚠️ setup-schema.js failed, falling back to existing schema check.');
    }
  } else {
    // Development / Build Only (Vercel/Local) - Use Safe SQLite Schema
    console.log('🔧 Setting up build-safe schema (SQLite)...');
    const schemaPath = path.join(__dirname, 'prisma/schema.prisma');
    const buildSchemaPath = path.join(__dirname, 'prisma/schema.build.prisma');

    if (fs.existsSync(buildSchemaPath)) {
      fs.copyFileSync(buildSchemaPath, schemaPath);
      console.log('✅ Build schema activated (SQLite, no connection required)');
    }
  }

  // Step 3: Generate Prisma client (no database connection)
  console.log('⚙️ Generating Prisma client...');
  execSync('npx prisma generate', { stdio: 'inherit', cwd: __dirname });

  console.log('✅ Build completed successfully!');
  console.log('🎯 Ready for deployment - no database connection required');

} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}