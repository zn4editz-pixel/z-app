#!/usr/bin/env node

// RUNTIME SCHEMA SWITCHER - SWITCH TO REAL SCHEMA AFTER BUILD
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const schemaPath = path.join(__dirname, '../prisma/schema.prisma');
const productionSchemaPath = path.join(__dirname, '../prisma/schema.production.prisma');
const developmentSchemaPath = path.join(__dirname, '../prisma/schema.development.prisma');

const isProduction = process.env.NODE_ENV === 'production' || process.env.DATABASE_URL;

try {
  if (isProduction) {
    // Switch to production schema at runtime
    if (fs.existsSync(productionSchemaPath)) {
      fs.copyFileSync(productionSchemaPath, schemaPath);
      console.log('🔄 Switched to production schema for runtime');
    }
  } else {
    // Switch to development schema at runtime
    if (fs.existsSync(developmentSchemaPath)) {
      fs.copyFileSync(developmentSchemaPath, schemaPath);
      console.log('🔄 Switched to development schema for runtime');
    }
  }
} catch (error) {
  console.log('⚠️ Schema switch failed, continuing with current schema:', error.message);
}