import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.join(__dirname, '.env');

try {
    let content = fs.readFileSync(envPath, 'utf8');
    const lines = content.split('\n');
    const dbIndex = lines.findIndex(line => line.trim().startsWith('DATABASE_URL='));

    const newUrl = 'DATABASE_URL="file:./dev.db"';

    if (dbIndex !== -1) {
        lines[dbIndex] = newUrl;
    } else {
        lines.push(newUrl);
    }

    fs.writeFileSync(envPath, lines.join('\n'));
    console.log('Successfully switched .env to SQLite URL');

} catch (e) { console.error(e); }
