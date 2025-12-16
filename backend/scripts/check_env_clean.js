
import 'dotenv/config';

console.log("--- ENV CHECK START ---");
const name = process.env.CLOUDINARY_CLOUD_NAME;
const key = process.env.CLOUDINARY_API_KEY;
const secret = process.env.CLOUDINARY_API_SECRET;

console.log(`CLOUD_NAME: ${name && name.length > 0 ? 'OK' : 'MISSING'}`);
console.log(`API_KEY: ${key && key.length > 0 ? 'OK' : 'MISSING'}`);
console.log(`API_SECRET: ${secret && secret.length > 0 ? 'OK' : 'MISSING'}`);
console.log("--- ENV CHECK END ---");
