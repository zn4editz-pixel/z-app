import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envProductionPath = path.join(__dirname, '.env.production');
const envPath = path.join(__dirname, '.env');

try {
    // Read production env to get the raw string
    const prodContent = fs.readFileSync(envProductionPath, 'utf8');
    const prodDbLine = prodContent.split('\n').find(line => line.trim().startsWith('DATABASE_URL='));

    if (!prodDbLine) {
        console.error('Could not find DATABASE_URL in .env.production');
        process.exit(1);
    }

    let cleanUrl = prodDbLine.split('#')[0].trim();
    cleanUrl = cleanUrl.replace(/^DATABASE_URL=["'](.*)["']$/, '$1');

    // Clean comments from the LINE itself if they are inline like DATABASE_URL=xxx # comment
    // But be careful not to strip # if it's in the password. 
    // Standard way: split by 'regex' that looks for space then #
    // But for now, we assume standard format.

    console.log('Original URL:', cleanUrl);

    // Manual Parsing Strategy:
    // postgres://[user]:[password]@[host]:[port]/[db]
    // We need to identify the LAST @ to find the host.
    // We need to identify the FIRST : after // to find the user separator? No, user:pass

    // Reliable method:
    // 1. Remove protocol 'postgres://' or 'postgresql://'
    // 2. Find LAST '@'. Everything after is host:port/db
    // 3. Everything before is user:password

    let protocol = 'postgresql://';
    let rest = '';

    if (cleanUrl.startsWith('postgres://')) {
        rest = cleanUrl.substring('postgres://'.length);
    } else if (cleanUrl.startsWith('postgresql://')) {
        rest = cleanUrl.substring('postgresql://'.length);
    } else {
        console.error('Unknown protocol');
        // If no protocol, maybe just add it? assume postgres
        rest = cleanUrl;
    }

    const lastAtIndex = rest.lastIndexOf('@');
    if (lastAtIndex === -1) {
        console.error('Invalid URL: No @ found');
        process.exit(1);
    }

    const userPass = rest.substring(0, lastAtIndex);
    const hostPart = rest.substring(lastAtIndex + 1);

    // Now split user:pass by the FIRST colon
    const firstColonIndex = userPass.indexOf(':');
    if (firstColonIndex === -1) {
        console.error('Invalid URL: No user:pass separator');
        process.exit(1);
    }

    const user = userPass.substring(0, firstColonIndex);
    const password = userPass.substring(firstColonIndex + 1);

    console.log('User:', user);
    // Encode the password!
    const encodedPassword = encodeURIComponent(password);
    console.log('Encoded Password:', encodedPassword);

    const newUrl = `postgresql://${user}:${encodedPassword}@${hostPart}`;

    // Write back to .env
    let currentEnv = fs.readFileSync(envPath, 'utf8');
    const lines = currentEnv.split('\n');
    const dbIndex = lines.findIndex(line => line.trim().startsWith('DATABASE_URL='));

    if (dbIndex !== -1) {
        lines[dbIndex] = `DATABASE_URL="${newUrl}"`;
    } else {
        lines.push(`DATABASE_URL="${newUrl}"`);
    }

    fs.writeFileSync(envPath, lines.join('\n'));
    console.log('Successfully updated .env with ENCODED password');

} catch (err) {
    console.error('Error fixing .env:', err);
}
