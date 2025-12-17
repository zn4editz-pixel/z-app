#!/usr/bin/env node

/**
 * Vercel Build Script
 * Ensures proper file extensions and MIME types for deployment
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const distDir = path.join(__dirname, 'dist');

function fixFileExtensions(dir) {
  if (!fs.existsSync(dir)) return;
  
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      fixFileExtensions(filePath);
    } else {
      // Ensure JSX files are renamed to JS
      if (file.endsWith('.jsx')) {
        const newPath = filePath.replace('.jsx', '.js');
        fs.renameSync(filePath, newPath);
        console.log(`✅ Renamed: ${file} -> ${path.basename(newPath)}`);
      }
      
      // Ensure TSX files are renamed to JS
      if (file.endsWith('.tsx')) {
        const newPath = filePath.replace('.tsx', '.js');
        fs.renameSync(filePath, newPath);
        console.log(`✅ Renamed: ${file} -> ${path.basename(newPath)}`);
      }
    }
  });
}

console.log('🔧 Fixing file extensions for Vercel deployment...');
fixFileExtensions(distDir);
console.log('✅ File extensions fixed!');