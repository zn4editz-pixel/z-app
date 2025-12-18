import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.join(__dirname, '..', '.env');

try {
    let content = fs.readFileSync(envPath, 'utf8');

    if (content.includes('/postgresql')) {
        const newContent = content.replace(/\/postgresql/g, '/postgres');
        fs.writeFileSync(envPath, newContent);
        console.log('Successfully fixed DATABASE_URL: Replaced /postgresql with /postgres');
    } else {
        console.log('DATABASE_URL does not seem to contain /postgresql. No changes made.');
        if (content.includes('/postgres')) {
            console.log('DATABASE_URL already contains /postgres. It seems correct.');
        } else {
            console.log('DATABASE_URL format is unexpected. Please check manually.');
        }
    }
} catch (error) {
    console.error('Error fixing .env:', error);
    process.exit(1);
}
