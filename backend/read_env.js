import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.join(__dirname, '.env');
try {
    const content = fs.readFileSync(envPath, 'utf8');
    console.log('--- ENV CONTENT START ---');
    console.log(content);
    console.log('--- ENV CONTENT END ---');

    const dbLine = content.split('\n').find(line => line.startsWith('DATABASE_URL='));
    if (dbLine) {
        console.log('DAATABASE_URL found:');
        console.log(dbLine);
        console.log('Character codes:');
        for (let i = 0; i < dbLine.length; i++) {
            process.stdout.write(dbLine.charCodeAt(i) + ' ');
        }
        console.log('');
    } else {
        console.log('DATABASE_URL not found in .env');
    }

} catch (err) {
    console.error(err);
}
