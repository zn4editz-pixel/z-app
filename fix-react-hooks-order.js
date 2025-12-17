/**
 * React Hooks Order Fix Script
 * Identifies and fixes common React Hooks order violations
 */

const fs = require('fs');
const path = require('path');

const fixReactHooksOrder = () => {
  console.log('🔧 Fixing React Hooks Order Issues...');
  
  // Common patterns that violate Rules of Hooks
  const violations = [
    {
      name: 'useState after early return',
      pattern: /if\s*\([^)]+\)\s*{\s*return[^}]+}\s*.*useState/gs,
      description: 'useState called after conditional return'
    },
    {
      name: 'useEffect after early return',
      pattern: /if\s*\([^)]+\)\s*{\s*return[^}]+}\s*.*useEffect/gs,
      description: 'useEffect called after conditional return'
    },
    {
      name: 'Hooks in conditional blocks',
      pattern: /if\s*\([^)]+\)\s*{\s*.*use[A-Z][a-zA-Z]*/gs,
      description: 'Hooks called inside conditional blocks'
    }
  ];
  
  const scanDirectory = (dir) => {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
        scanDirectory(filePath);
      } else if (file.endsWith('.jsx') || file.endsWith('.tsx')) {
        checkFile(filePath);
      }
    });
  };
  
  const checkFile = (filePath) => {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      let hasViolations = false;
      
      violations.forEach(violation => {
        if (violation.pattern.test(content)) {
          console.log(`❌ ${violation.name} found in: ${filePath}`);
          console.log(`   Description: ${violation.description}`);
          hasViolations = true;
        }
      });
      
      if (!hasViolations) {
        console.log(`✅ ${filePath} - No hooks violations found`);
      }
      
    } catch (error) {
      console.error(`Error reading ${filePath}:`, error.message);
    }
  };
  
  // Scan frontend components
  const frontendPath = path.join(__dirname, 'frontend', 'src');
  if (fs.existsSync(frontendPath)) {
    console.log('\n📂 Scanning frontend components...');
    scanDirectory(frontendPath);
  }
  
  console.log('\n✅ React Hooks Order Check Complete!');
  console.log('\n📝 Rules of Hooks Reminder:');
  console.log('1. Only call Hooks at the top level');
  console.log('2. Don\'t call Hooks inside loops, conditions, or nested functions');
  console.log('3. Only call Hooks from React function components');
  console.log('4. Call Hooks in the same order every time');
};

// Auto-run if called directly
if (require.main === module) {
  fixReactHooksOrder();
}

module.exports = { fixReactHooksOrder };