import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const srcDir = 'C:/Users/z4fwa/OneDrive/Pictures/Documents/z-app/frontend/src';

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(fullPath));
    } else if (file.endsWith('.css')) {
      results.push(fullPath);
    }
  });
  return results;
}

const cssFiles = walk(srcDir);
console.log(`Found ${cssFiles.length} CSS files. Scanning for :hover...\n`);

cssFiles.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  // Simple regex to find selectors with :hover and their rule body (up to closing bracket)
  // Let's just find lines containing :hover
  const lines = content.split('\n');
  const matches = [];
  lines.forEach((line, index) => {
    if (line.includes(':hover')) {
      matches.push({ lineNum: index + 1, text: line.trim() });
    }
  });

  if (matches.length > 0) {
    console.log(`📄 File: ${path.relative(srcDir, file)} (${matches.length} matches)`);
    matches.forEach(m => {
      console.log(`   Line ${m.lineNum}: ${m.text}`);
    });
    console.log();
  }
});
