import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.join(__dirname, '.env');

try {
    const content = fs.readFileSync(envPath, 'utf8');
    const dbLine = content.split('\n').find(line => line.trim().startsWith('DATABASE_URL='));

    if (dbLine) {
        console.log('Raw line length:', dbLine.length);
        const urlValue = dbLine.split('=')[1].trim().replace(/['"]/g, ''); // Remove quotes

        // Basic regex to parse postgres://user:password@host:port/db
        // This is just for debugging output, not a full validator
        console.log('URL starts with:', urlValue.substring(0, 15) + '...');

        try {
            const parsed = new URL(urlValue);
            console.log('Successfully parsed by Node URL module:');
            console.log('Protocol:', parsed.protocol);
            console.log('Username:', parsed.username);
            console.log('Password (masked):', parsed.password ? '******' : 'none');
            console.log('Host:', parsed.hostname);
            console.log('Port:', parsed.port);
            console.log('Path:', parsed.pathname);
        } catch (e) {
            console.log('Node URL module failed to parse:', e.message);
            console.log('This confirms the URL is malformed.');

            // heuristics
            if (urlValue.includes('@') && urlValue.lastIndexOf(':') > urlValue.indexOf('@')) {
                // Check for characters that look like a port but aren't
                const afterAt = urlValue.split('@')[1];
                const parts = afterAt.split(':');
                if (parts.length > 1) {
                    const potentialPort = parts[1].split('/')[0];
                    console.log('Potential port string found:', potentialPort);
                    console.log('Is valid number?', !isNaN(parseInt(potentialPort)));
                }
            }
        }
    } else {
        console.log('DATABASE_URL not found.');
    }

} catch (err) {
    console.error(err);
}
