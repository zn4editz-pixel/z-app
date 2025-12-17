#!/usr/bin/env node

// BUILD ERROR FIX SCRIPT
// Fixes MIME type and React import issues

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔧 Fixing build errors...');

// 1. Fix React imports in all JSX files
const fixReactImports = (dir) => {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && !file.includes('node_modules') && !file.includes('.git')) {
      fixReactImports(filePath);
    } else if (file.endsWith('.jsx') || file.endsWith('.tsx')) {
      let content = fs.readFileSync(filePath, 'utf8');
      
      // Check if React is already imported
      if (!content.includes('import React') && content.includes('export')) {
        // Add React import at the top
        const lines = content.split('\n');
        const firstImportIndex = lines.findIndex(line => line.trim().startsWith('import'));
        
        if (firstImportIndex !== -1) {
          lines.splice(firstImportIndex, 0, 'import React from "react";');
          content = lines.join('\n');
          fs.writeFileSync(filePath, content);
          console.log(`✅ Fixed React import in: ${filePath}`);
        }
      }
    }
  });
};

// 2. Clean build artifacts
const cleanBuild = () => {
  const dirsToClean = [
    'frontend/dist',
    'frontend/node_modules/.vite',
    'frontend/.vite'
  ];
  
  dirsToClean.forEach(dir => {
    const fullPath = path.join(__dirname, dir);
    if (fs.existsSync(fullPath)) {
      fs.rmSync(fullPath, { recursive: true, force: true });
      console.log(`🧹 Cleaned: ${dir}`);
    }
  });
};

// 3. Fix package.json scripts
const fixPackageJson = () => {
  const packagePath = path.join(__dirname, 'frontend/package.json');
  if (fs.existsSync(packagePath)) {
    const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    
    // Ensure proper build script
    pkg.scripts = {
      ...pkg.scripts,
      "build": "vite build --mode production",
      "build:clean": "rm -rf dist && vite build --mode production",
      "preview": "vite preview --port 4173"
    };
    
    fs.writeFileSync(packagePath, JSON.stringify(pkg, null, 2));
    console.log('✅ Fixed package.json scripts');
  }
};

// Run fixes
try {
  console.log('🔧 Starting build error fixes...');
  
  cleanBuild();
  fixPackageJson();
  
  // Fix React imports in frontend
  const frontendSrc = path.join(__dirname, 'frontend/src');
  if (fs.existsSync(frontendSrc)) {
    fixReactImports(frontendSrc);
  }
  
  console.log('✅ Build error fixes completed!');
  console.log('');
  console.log('🚀 Next steps:');
  console.log('1. cd frontend');
  console.log('2. npm install');
  console.log('3. npm run build:clean');
  console.log('4. Test the build');
  
} catch (error) {
  console.error('❌ Fix failed:', error.message);
  process.exit(1);
}