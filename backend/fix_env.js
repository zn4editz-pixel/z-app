import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envProductionPath = path.join(__dirname, '.env.production');
const envPath = path.join(__dirname, '.env');

try {
    // Read production env
    const prodContent = fs.readFileSync(envProductionPath, 'utf8');
    const prodDbLine = prodContent.split('\n').find(line => line.trim().startsWith('DATABASE_URL='));

    if (!prodDbLine) {
        console.error('Could not find DATABASE_URL in .env.production');
        process.exit(1);
    }

    // Clean the URL - remove comments, whitespace, quotes
    let cleanUrl = prodDbLine.split('#')[0].trim(); // Remove comments
    // Remove wrapping quotes if present
    cleanUrl = cleanUrl.replace(/^DATABASE_URL=["'](.*)["']$/, 'DATABASE_URL=$1');

    console.log('Found clean URL line:', cleanUrl);

    // Read current .env
    let currentEnv = fs.readFileSync(envPath, 'utf8');

    // Replace or append
    const lines = currentEnv.split('\n');
    const dbIndex = lines.findIndex(line => line.trim().startsWith('DATABASE_URL='));

    if (dbIndex !== -1) {
        lines[dbIndex] = cleanUrl;
    } else {
        lines.push(cleanUrl);
    }

    // Join and Write back
    fs.writeFileSync(envPath, lines.join('\n'));
    console.log('Successfully updated .env with clean DATABASE_URL');

} catch (err) {
    console.error('Error fixing .env:', err);
}
