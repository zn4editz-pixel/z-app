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
    let prodDbLine = prodContent.split('\n').find(line => line.trim().startsWith('DATABASE_URL='));

    if (!prodDbLine) {
        console.error('Could not find DATABASE_URL in .env.production');
        process.exit(1);
    }

    // Strip 'DATABASE_URL=' prefix
    // Handle optional quotes
    let value = prodDbLine.trim().substring('DATABASE_URL='.length);
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
    }

    // Strip comments
    value = value.split(' #')[0].trim();

    console.log('Clean Raw Value:', value);

    // Parse Protocol
    let protocol = '';
    let rest = '';
    if (value.startsWith('postgres://')) {
        protocol = 'postgres';
        rest = value.substring('postgres://'.length);
    } else if (value.startsWith('postgresql://')) {
        protocol = 'postgresql';
        rest = value.substring('postgresql://'.length);
    } else {
        console.error('Unknown protocol in URL:', value);
        process.exit(1);
    }

    // Find Host Part (last @)
    const lastAtIndex = rest.lastIndexOf('@');
    if (lastAtIndex === -1) {
        console.error('Invalid URL structure (no @)');
        process.exit(1);
    }

    const userPass = rest.substring(0, lastAtIndex);
    const hostPart = rest.substring(lastAtIndex + 1);

    // Split User/Pass (first :)
    const firstColonIndex = userPass.indexOf(':');
    if (firstColonIndex === -1) {
        console.error('Invalid URL structure (no user:pass separator)');
        process.exit(1);
    }

    const user = userPass.substring(0, firstColonIndex);
    const password = userPass.substring(firstColonIndex + 1);

    // Encode Password
    const encodedPassword = encodeURIComponent(password);

    console.log('User:', user);
    console.log('Encoded Password:', encodedPassword);
    console.log('Host Part:', hostPart);

    // Reconstruct correctly
    const newUrl = `${protocol}://${user}:${encodedPassword}@${hostPart}`;
    console.log('New URL prefix:', newUrl.substring(0, 20) + '...');

    // Write to .env
    let currentEnv = fs.readFileSync(envPath, 'utf8');
    const lines = currentEnv.split('\n');
    const dbIndex = lines.findIndex(line => line.trim().startsWith('DATABASE_URL='));

    if (dbIndex !== -1) {
        lines[dbIndex] = `DATABASE_URL="${newUrl}"`;
    } else {
        lines.push(`DATABASE_URL="${newUrl}"`);
    }

    fs.writeFileSync(envPath, lines.join('\n'));
    console.log('Successfully wrote corrected .env');

} catch (err) {
    console.error('Error:', err);
}
