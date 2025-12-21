const fs = require('fs');
const path = require('path');

const stylesDir = path.join(__dirname, '../../frontend/src/styles');

if (!fs.existsSync(stylesDir)) {
    console.error(`Directory not found: ${stylesDir}`);
    process.exit(1);
}

const files = fs.readdirSync(stylesDir).filter(f => f.endsWith('.css'));
// Add migrated-theme folder to list if possible, or just run separately? 
// For now, let's stick to styles folder as per previous logic.
const varsToFix = ['p', 's', 'a', 'n', 'b1', 'b2', 'b3', 'bc', 'pc', 'sc', 'ac', 'nc', 'in', 'su', 'wa', 'er', 'erc'];

let totalReplacements = 0;

files.forEach(file => {
    const filePath = path.join(stylesDir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    varsToFix.forEach(v => {
        // Regex to match hsl(var(--v)) or hsl(var(--v) / alpha) or hsl(var(--v)/alpha)
        // Groups: 
        // 1: The variable part (var(--v))
        // 2: The optional / alpha part
        // We match strict hsl( ... ) wrapper.

        // This regex matches: hsl(var(--p)) and hsl(var(--p) / 0.5)
        const regex = new RegExp(`hsl\\(\\s*var\\(--${v}\\)(?:\\s*\\/\\s*[\\d.]+%?)?\\s*\\)`, 'g');

        content = content.replace(regex, (match) => {
            return match.replace('hsl', 'oklch');
        });
    });

    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated: ${file}`);
        totalReplacements++;
    }
});

console.log(`Fixed colors in ${totalReplacements} files.`);
