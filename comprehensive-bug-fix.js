#!/usr/bin/env node

/**
 * Comprehensive Bug Detection and Fix Tool
 * Scans the entire Z-APP project for potential issues and provides fixes
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Z-APP Comprehensive Bug Detection & Fix Tool\n');

// Configuration
const FRONTEND_PATH = './frontend/src';
const BACKEND_PATH = './backend/src';
const BACKEND_URL = 'https://z-app-backend.onrender.com';
const FRONTEND_URL = 'https://z-app-official.vercel.app';

// Bug patterns to detect
const BUG_PATTERNS = {
  // JavaScript/React issues
  'Unused imports': /import\s+.*\s+from\s+['"][^'"]+['"];\s*(?=\n\s*(?:import|$))/g,
  'Console.log in production': /console\.log\(/g,
  'Hardcoded URLs': /(http:\/\/localhost|127\.0\.0\.1)/g,
  'Missing error handling': /await\s+[^;]+;(?!\s*catch)/g,
  'Deprecated React patterns': /componentWillMount|componentWillReceiveProps|componentWillUpdate/g,
  
  // Performance issues
  'Inefficient re-renders': /useEffect\(\(\)\s*=>\s*{[^}]*},\s*\[\]\)/g,
  'Memory leaks': /addEventListener.*(?!removeEventListener)/g,
  'Large bundle imports': /import\s+\*\s+as/g,
  
  // Security issues
  'Unsafe innerHTML': /dangerouslySetInnerHTML|innerHTML\s*=/g,
  'Exposed secrets': /(password|secret|key|token)\s*[:=]\s*['"][^'"]+['"]/gi,
  'XSS vulnerabilities': /document\.write|eval\(/g,
  
  // UI/UX issues
  'Missing accessibility': /<(button|input|img)(?![^>]*(?:aria-label|alt))/g,
  'Hardcoded colors': /#[0-9a-fA-F]{3,6}(?!.*\/\/)/g,
  'Missing loading states': /fetch\(|axios\.|api\./g,
  
  // Video call specific issues
  'Poor video constraints': /width:\s*{\s*ideal:\s*640/g,
  'Missing codec preferences': /RTCPeerConnection.*(?!codec)/g,
  'No connection monitoring': /createPeerConnection.*(?!getStats)/g
};

// File extensions to scan
const SCAN_EXTENSIONS = ['.js', '.jsx', '.ts', '.tsx', '.json'];

// Scan directory for files
function scanDirectory(dir, extensions = SCAN_EXTENSIONS) {
  const files = [];
  
  function scan(currentDir) {
    try {
      const items = fs.readdirSync(currentDir);
      
      for (const item of items) {
        const fullPath = path.join(currentDir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
          scan(fullPath);
        } else if (stat.isFile() && extensions.some(ext => item.endsWith(ext))) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      console.warn(`⚠️ Could not scan directory: ${currentDir}`);
    }
  }
  
  scan(dir);
  return files;
}

// Analyze file for bugs
function analyzeFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const issues = [];
    
    for (const [bugType, pattern] of Object.entries(BUG_PATTERNS)) {
      const matches = content.match(pattern);
      if (matches) {
        issues.push({
          type: bugType,
          count: matches.length,
          severity: getSeverity(bugType),
          examples: matches.slice(0, 3) // Show first 3 examples
        });
      }
    }
    
    return issues;
  } catch (error) {
    console.warn(`⚠️ Could not analyze file: ${filePath}`);
    return [];
  }
}

// Get severity level
function getSeverity(bugType) {
  const critical = ['XSS vulnerabilities', 'Exposed secrets', 'Unsafe innerHTML'];
  const high = ['Missing error handling', 'Memory leaks', 'Security issues'];
  const medium = ['Performance issues', 'Poor video constraints', 'Hardcoded URLs'];
  const low = ['Console.log in production', 'Unused imports', 'Hardcoded colors'];
  
  if (critical.some(c => bugType.includes(c))) return 'CRITICAL';
  if (high.some(h => bugType.includes(h))) return 'HIGH';
  if (medium.some(m => bugType.includes(m))) return 'MEDIUM';
  return 'LOW';
}

// Test API endpoints
async function testAPIEndpoints() {
  console.log('🌐 Testing API Endpoints...\n');
  
  const endpoints = [
    { name: 'Backend Health', url: `${BACKEND_URL}/api/health` },
    { name: 'Frontend', url: FRONTEND_URL },
    { name: 'Socket.IO', url: `${BACKEND_URL}/socket.io/` },
    { name: 'Admin Users', url: `${BACKEND_URL}/api/admin/users` },
    { name: 'Verification Requests', url: `${BACKEND_URL}/api/admin/verification-requests` }
  ];
  
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint.url, { method: 'GET' });
      const status = response.status;
      
      if (status === 200) {
        console.log(`✅ ${endpoint.name}: Working (${status})`);
      } else if (status === 401 || status === 403) {
        console.log(`🔒 ${endpoint.name}: Protected (${status}) - Expected`);
      } else if (status === 404) {
        console.log(`❌ ${endpoint.name}: Not Found (${status})`);
      } else {
        console.log(`⚠️ ${endpoint.name}: Status ${status}`);
      }
    } catch (error) {
      console.log(`❌ ${endpoint.name}: ${error.message}`);
    }
  }
  console.log('');
}

// Generate fix suggestions
function generateFixSuggestions(issues) {
  const fixes = [];
  
  for (const issue of issues) {
    switch (issue.type) {
      case 'Console.log in production':
        fixes.push({
          issue: issue.type,
          fix: 'Replace console.log with secure logger or remove in production build',
          code: 'import logger from "../utils/secureLogger.js"; logger.debug("message");'
        });
        break;
        
      case 'Poor video constraints':
        fixes.push({
          issue: issue.type,
          fix: 'Use adaptive 4K video constraints based on connection speed',
          code: 'import { getOptimalVideoConstraints } from "../utils/videoQualityOptimizer.js";'
        });
        break;
        
      case 'Missing error handling':
        fixes.push({
          issue: issue.type,
          fix: 'Add try-catch blocks around async operations',
          code: 'try { await operation(); } catch (error) { console.error("Error:", error); }'
        });
        break;
        
      case 'Hardcoded URLs':
        fixes.push({
          issue: issue.type,
          fix: 'Use environment variables for URLs',
          code: 'const API_URL = import.meta.env.VITE_API_BASE_URL || "https://z-app-backend.onrender.com";'
        });
        break;
        
      case 'Memory leaks':
        fixes.push({
          issue: issue.type,
          fix: 'Add cleanup in useEffect return function',
          code: 'useEffect(() => { /* setup */ return () => { /* cleanup */ }; }, []);'
        });
        break;
        
      default:
        fixes.push({
          issue: issue.type,
          fix: 'Review and fix manually',
          code: 'See documentation for best practices'
        });
    }
  }
  
  return fixes;
}

// Main analysis function
async function runComprehensiveAnalysis() {
  console.log('🚀 Starting Comprehensive Bug Analysis...\n');
  
  // Test API endpoints first
  await testAPIEndpoints();
  
  // Scan frontend files
  console.log('📁 Scanning Frontend Files...');
  const frontendFiles = scanDirectory(FRONTEND_PATH);
  console.log(`Found ${frontendFiles.length} frontend files\n`);
  
  // Scan backend files
  console.log('📁 Scanning Backend Files...');
  const backendFiles = scanDirectory(BACKEND_PATH);
  console.log(`Found ${backendFiles.length} backend files\n`);
  
  // Analyze all files
  const allIssues = [];
  const allFiles = [...frontendFiles, ...backendFiles];
  
  console.log('🔍 Analyzing Files for Issues...');
  for (const file of allFiles) {
    const issues = analyzeFile(file);
    if (issues.length > 0) {
      allIssues.push({ file, issues });
    }
  }
  
  // Generate report
  console.log('\n📊 ANALYSIS RESULTS\n');
  console.log('='.repeat(50));
  
  if (allIssues.length === 0) {
    console.log('🎉 No issues found! Your code looks great!');
    return;
  }
  
  // Group issues by severity
  const issuesBySeverity = {
    CRITICAL: [],
    HIGH: [],
    MEDIUM: [],
    LOW: []
  };
  
  for (const fileIssues of allIssues) {
    for (const issue of fileIssues.issues) {
      issuesBySeverity[issue.severity].push({
        file: fileIssues.file,
        ...issue
      });
    }
  }
  
  // Display results
  for (const [severity, issues] of Object.entries(issuesBySeverity)) {
    if (issues.length > 0) {
      const emoji = severity === 'CRITICAL' ? '🚨' : severity === 'HIGH' ? '⚠️' : severity === 'MEDIUM' ? '🔶' : '💡';
      console.log(`\n${emoji} ${severity} ISSUES (${issues.length}):`);
      
      const grouped = {};
      for (const issue of issues) {
        if (!grouped[issue.type]) grouped[issue.type] = [];
        grouped[issue.type].push(issue);
      }
      
      for (const [type, typeIssues] of Object.entries(grouped)) {
        console.log(`  • ${type}: ${typeIssues.length} occurrences`);
        console.log(`    Files: ${typeIssues.map(i => path.basename(i.file)).join(', ')}`);
      }
    }
  }
  
  // Generate fix suggestions
  console.log('\n🔧 FIX SUGGESTIONS\n');
  console.log('='.repeat(50));
  
  const allUniqueIssues = [...new Set(allIssues.flatMap(f => f.issues.map(i => i.type)))];
  const fixes = generateFixSuggestions(allUniqueIssues.map(type => ({ type })));
  
  for (const fix of fixes) {
    console.log(`\n🛠️ ${fix.issue}:`);
    console.log(`   Solution: ${fix.fix}`);
    console.log(`   Code: ${fix.code}`);
  }
  
  // Summary
  const totalIssues = allIssues.reduce((sum, f) => sum + f.issues.length, 0);
  const criticalCount = issuesBySeverity.CRITICAL.length;
  const highCount = issuesBySeverity.HIGH.length;
  
  console.log('\n📋 SUMMARY\n');
  console.log('='.repeat(50));
  console.log(`Total Issues Found: ${totalIssues}`);
  console.log(`Critical Issues: ${criticalCount}`);
  console.log(`High Priority Issues: ${highCount}`);
  console.log(`Files Analyzed: ${allFiles.length}`);
  
  if (criticalCount > 0) {
    console.log('\n🚨 URGENT: Fix critical issues immediately!');
  } else if (highCount > 0) {
    console.log('\n⚠️ IMPORTANT: Address high priority issues soon.');
  } else {
    console.log('\n✅ GOOD: No critical or high priority issues found!');
  }
  
  console.log('\n🎯 NEXT STEPS:');
  console.log('1. Fix critical and high priority issues first');
  console.log('2. Test all functionality after fixes');
  console.log('3. Run this tool again to verify fixes');
  console.log('4. Deploy to production when clean');
  
  console.log('\n🚀 Z-APP Status: Ready for production optimization!');
}

// Run the analysis
runComprehensiveAnalysis().catch(console.error);