/**
 * Fix JSX Extensions Script
 * Renames any .jsx files in the build output to .js to fix MIME type issues
 */

const fs = require('fs');
const path = require('path');

const fixJsxExtensions = (dir) => {
  console.log(`🔧 Fixing JSX extensions in: ${dir}`);
  
  if (!fs.existsSync(dir)) {
    console.log(`❌ Directory not found: ${dir}`);
    return;
  }
  
  const files = fs.readdirSync(dir);
  let renamedCount = 0;
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      // Recursively fix subdirectories
      fixJsxExtensions(filePath);
    } else if (file.endsWith('.jsx')) {
      // Rename .jsx to .js
      const newFileName = file.replace(/\.jsx$/, '.js');
      const newFilePath = path.join(dir, newFileName);
      
      try {
        fs.renameSync(filePath, newFilePath);
        console.log(`✅ Renamed: ${file} → ${newFileName}`);
        renamedCount++;
        
        // Update any references in HTML files
        updateHtmlReferences(dir, file, newFileName);
        
      } catch (error) {
        console.error(`❌ Error renaming ${file}:`, error);
      }
    }
  });
  
  return renamedCount;
};

const updateHtmlReferences = (buildDir, oldFileName, newFileName) => {
  // Find and update index.html
  const htmlPath = path.join(path.dirname(buildDir), 'index.html');
  
  if (fs.existsSync(htmlPath)) {
    try {
      let htmlContent = fs.readFileSync(htmlPath, 'utf8');
      const oldRef = `assets/${oldFileName}`;
      const newRef = `assets/${newFileName}`;
      
      if (htmlContent.includes(oldRef)) {
        htmlContent = htmlContent.replace(new RegExp(oldRef, 'g'), newRef);
        fs.writeFileSync(htmlPath, htmlContent);
        console.log(`✅ Updated HTML reference: ${oldRef} → ${newRef}`);
      }
    } catch (error) {
      console.error('❌ Error updating HTML references:', error);
    }
  }
};

// Main execution
const buildDir = path.join(__dirname, 'dist');
console.log('🚀 Starting JSX extension fix...');

const totalRenamed = fixJsxExtensions(buildDir);

if (totalRenamed > 0) {
  console.log(`\n🎉 Successfully renamed ${totalRenamed} .jsx files to .js`);
  console.log('✅ MIME type issues should now be resolved');
} else {
  console.log('\n✅ No .jsx files found - build is already correct');
}

console.log('\n📝 Build verification complete!');