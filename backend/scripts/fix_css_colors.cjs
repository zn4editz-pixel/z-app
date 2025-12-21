const fs = require('fs');
const path = require('path');

const stylesDir = path.join(__dirname, '../../frontend/src/styles');

if (!fs.existsSync(stylesDir)) {
    console.error(`Directory not found: ${stylesDir}`);
    process.exit(1);
}

const files = fs.readdirSync(stylesDir).filter(f => f.endsWith('.css'));
const varsToFix = ['p', 's', 'a', 'n', 'b1', 'b2', 'b3', 'bc', 'pc', 'sc', 'ac', 'nc', 'in', 'su', 'wa', 'er'];

let totalReplacements = 0;

files.forEach(file => {
    const filePath = path.join(stylesDir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    varsToFix.forEach(v => {
        // Regex to match hsl(var(--v)) globally
        // Be careful to match exact variable name boundaries if possible, but these short ones are distinct enough in this context
        const regex = new RegExp(`hsl\\(var\\(--${v}\\)\\)`, 'g');
        content = content.replace(regex, `oklch(var(--${v}))`);

        // Also handle cases with !important inside the parens (unlikely but possible) or whitespace
        const regexSpace = new RegExp(`hsl\\(\\s*var\\(--${v}\\)\\s*\\)`, 'g');
        content = content.replace(regexSpace, `oklch(var(--${v}))`);
    });

    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated: ${file}`);
        totalReplacements++;
    }
});

console.log(`Fixed colors in ${totalReplacements} files.`);
