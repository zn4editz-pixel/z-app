#!/usr/bin/env node

/**
 * Remove Console Logs Script
 * Removes all console.log statements from production build
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const distDir = path.join(__dirname, 'dist');

function removeConsoleLogs(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Remove console statements
    content = content.replace(/console\.(log|debug|info|warn|error|assert|dir|dirxml|group|groupEnd|time|timeEnd|count|trace|profile|profileEnd)\s*\([^)]*\)\s*;?/g, '');
    
    // Remove empty lines left by console removal
    content = content.replace(/^\s*[\r\n]/gm, '');
    
    fs.writeFileSync(filePath, content);
    console.log(`✅ Cleaned: ${filePath}`);
  } catch (error) {
    console.error(`❌ Error cleaning ${filePath}:`, error.message);
  }
}

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      processDirectory(filePath);
    } else if (file.endsWith('.js') || file.endsWith('.mjs')) {
      removeConsoleLogs(filePath);
    }
  });
}

if (fs.existsSync(distDir)) {
  console.log('🧹 Removing console logs from production build...');
  processDirectory(distDir);
  console.log('✅ Console logs removed from production build');
} else {
  console.log('❌ Dist directory not found');
}