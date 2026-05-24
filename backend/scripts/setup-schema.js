#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const schemaPath = path.join(__dirname, '../prisma/schema.prisma');

if (fs.existsSync(schemaPath)) {
  console.log('✅ Prisma schema ready (PostgreSQL)');
} else {
  console.error('❌ Prisma schema not found!');
  process.exit(1);
}
