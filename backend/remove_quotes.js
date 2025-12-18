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

    if (dbIndex !== -1) {
        let line = lines[dbIndex];
        let value = line.substring('DATABASE_URL='.length).trim();

        // Remove wrapping quotes
        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
            lines[dbIndex] = `DATABASE_URL=${value}`;
            fs.writeFileSync(envPath, lines.join('\n'));
            console.log('Successfully removed quotes from DATABASE_URL');
            console.log('New line:', lines[dbIndex]);
        } else {
            console.log('No quotes to remove.');
            console.log('Current line:', line);
        }
    } else {
        console.log('DATABASE_URL not found');
    }

} catch (e) { console.error(e); }
