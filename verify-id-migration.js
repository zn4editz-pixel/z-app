#!/usr/bin/env node

/**
 * Verification Script for PostgreSQL ID Migration
 * 
 * This script checks for any remaining _id references that might cause issues
 * Run with: node verify-id-migration.js
 */

const fs = require('fs');
const path = require('path');

const CRITICAL_PATTERNS = [
  /authUser\._id/g,
  /user\._id(?!\s*\|\|)/g,  // user._id not followed by ||
  /selectedUser\._id(?!\s*\|\|)/g,
  /msg\._id(?!\s*\|\|)/g,
  /notification\._id(?!\s*\|\|)/g,
  /socket\.emit\([^)]*_id/g,
];

const EXCLUDE_DIRS = ['node_modules', 'dist', 'build', '.git', 'backup'];
const INCLUDE_EXTENSIONS = ['.js', '.jsx', '.ts', '.tsx'];

let issuesFound = 0;
let filesChecked = 0;

function shouldCheckFile(filePath) {
  const ext = path.extname(filePath);
  if (!INCLUDE_EXTENSIONS.includes(ext)) return false;
  
  const parts = filePath.split(path.sep);
  return !parts.some(part => EXCLUDE_DIRS.includes(part));
}

function checkFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const issues = [];
    
    CRITICAL_PATTERNS.forEach((pattern, index) => {
      const matches = content.match(pattern);
      if (matches) {
        matches.forEach(match => {
          // Skip if it's in idHelper.js (intentional)
          if (filePath.includes('idHelper.js')) return;
          
          // Skip if it's a comment
          const lines = content.split('\n');
          const matchingLines = lines.filter(line => line.includes(match));
          const isComment = matchingLines.some(line => 
            line.trim().startsWith('//') || 
            line.trim().startsWith('*') ||
            line.trim().startsWith('/*')
          );
          
          if (!isComment) {
            issues.push({
              pattern: pattern.source,
              match: match,
              line: content.substring(0, content.indexOf(match)).split('\n').length
            });
          }
        });
      }
    });
    
    if (issues.length > 0) {
      console.log(`\n❌ Issues in ${filePath}:`);
      issues.forEach(issue => {
        console.log(`   Line ${issue.line}: ${issue.match}`);
        issuesFound++;
      });
    }
    
    filesChecked++;
  } catch (error) {
    // Skip files that can't be read
  }
}

function walkDirectory(dir) {
  try {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        if (!EXCLUDE_DIRS.includes(file)) {
          walkDirectory(filePath);
        }
      } else if (shouldCheckFile(filePath)) {
        checkFile(filePath);
      }
    });
  } catch (error) {
    // Skip directories that can't be read
  }
}

console.log('🔍 Verifying PostgreSQL ID Migration...\n');
console.log('Checking for critical _id references...\n');

// Check frontend
if (fs.existsSync('./frontend/src')) {
  console.log('📁 Checking frontend/src...');
  walkDirectory('./frontend/src');
}

// Check backend
if (fs.existsSync('./backend/src')) {
  console.log('📁 Checking backend/src...');
  walkDirectory('./backend/src');
}

console.log(`\n✅ Verification complete!`);
console.log(`   Files checked: ${filesChecked}`);
console.log(`   Issues found: ${issuesFound}`);

if (issuesFound === 0) {
  console.log('\n🎉 No critical issues found! Migration looks good.');
  console.log('\n📝 Note: Some _id references in idHelper.js are intentional for compatibility.');
} else {
  console.log('\n⚠️  Please review the issues above.');
  console.log('   Most can be fixed by replacing ._id with .id');
  process.exit(1);
}
