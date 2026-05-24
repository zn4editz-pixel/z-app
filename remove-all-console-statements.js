#!/usr/bin/env node
/**
 * 🧹 PRODUCTION CONSOLE CLEANUP
 * Removes all console statements from production builds
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
function removeConsoleFromFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalLength = content.length;
    // Remove console.log, console.error, console.warn, console.info
    content = content.replace(/console\.(log|error|warn|info|debug|trace)\([^;]*\);?/g, '');
    // Remove empty lines left by console removal
    content = content.replace(/^\s*\n/gm, '');
    // Remove console statements without semicolons
    content = content.replace(/console\.(log|error|warn|info|debug|trace)\([^\n]*\)/g, '');
    if (content.length !== originalLength) {
      fs.writeFileSync(filePath, content, 'utf8');
      return true;
    }
    return false;
  } catch (error) {
    return false;
  }
}
function cleanDirectory(dirPath, extensions = ['.js', '.jsx', '.ts', '.tsx']) {
  let cleanedFiles = 0;
  function walkDir(currentPath) {
    const items = fs.readdirSync(currentPath);
    for (const item of items) {
      const fullPath = path.join(currentPath, item);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        // Skip node_modules and .git
        if (!['node_modules', '.git', 'dist', 'build'].includes(item)) {
          walkDir(fullPath);
        }
      } else if (extensions.some(ext => item.endsWith(ext))) {
        if (removeConsoleFromFile(fullPath)) {
          cleanedFiles++;
        }
      }
    }
  }
  walkDir(dirPath);
  return cleanedFiles;
}
// Clean backend
const backendPath = path.join(__dirname, 'backend', 'src');
const backendCleaned = cleanDirectory(backendPath);
// Clean frontend
const frontendPath = path.join(__dirname, 'frontend', 'src');
const frontendCleaned = cleanDirectory(frontendPath);
// Clean root scripts (but keep this one)
const rootFiles = fs.readdirSync(__dirname).filter(file => 
  file.endsWith('.js') && 
  !file.includes('remove-console') &&
  !file.includes('achieve-100-percent')
);
let rootCleaned = 0;
for (const file of rootFiles) {
  if (removeConsoleFromFile(path.join(__dirname, file))) {
    rootCleaned++;
  }
}
