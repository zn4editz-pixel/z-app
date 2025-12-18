#!/usr/bin/env node

// AUTOMATIC SCHEMA SWITCHER FOR PRODUCTION/DEVELOPMENT
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isProduction = process.env.NODE_ENV === 'production' || process.env.RENDER;
const isBuild = process.argv.includes('--build') || process.env.RENDER_BUILD;

const schemaPath = path.join(__dirname, '../prisma/schema.prisma');
const productionSchemaPath = path.join(__dirname, '../prisma/schema.production.prisma');
const developmentSchemaPath = path.join(__dirname, '../prisma/schema.development.prisma');
const buildSchemaPath = path.join(__dirname, '../prisma/schema.build.prisma');

// Backup current schema as development schema if it doesn't exist
if (!fs.existsSync(developmentSchemaPath) && fs.existsSync(schemaPath)) {
  fs.copyFileSync(schemaPath, developmentSchemaPath);
  console.log('✅ Backed up current schema as development schema');
}

try {
  if (isProduction || process.env.RENDER) {
    // Use production schema (PostgreSQL for Render)
    if (fs.existsSync(productionSchemaPath)) {
      fs.copyFileSync(productionSchemaPath, schemaPath);
      console.log('✅ Using production schema (CockroachDB for Render)');
      console.log('🔗 Database URL:', process.env.DATABASE_URL ? 'Set' : 'Not set');
      console.log('🚀 Render deployment mode activated');
    } else {
      console.error('❌ Production schema not found!');
      process.exit(1);
    }
  } else {
    // Use development schema (SQLite)
    if (fs.existsSync(developmentSchemaPath)) {
      fs.copyFileSync(developmentSchemaPath, schemaPath);
      console.log('✅ Using development schema (SQLite)');
    } else {
      console.log('⚠️ Development schema not found, keeping current schema');
    }
  }
} catch (error) {
  console.error('❌ Schema setup failed:', error.message);
  process.exit(1);
}