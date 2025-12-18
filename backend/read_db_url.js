import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.join(__dirname, '.env');

try {
    const content = fs.readFileSync(envPath, 'utf8');
    const dbLine = content.split('\n').find(line => line.trim().startsWith('DATABASE_URL='));
    console.log(dbLine);
} catch (e) { console.error(e); }
