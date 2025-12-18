const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '../.env');
const newContent = `DATABASE_URL="postgresql://s4fwan_x:tZrL_-MUluvmSdrFNEy5rw@iron-orc-11183.jxf.gcp-europe-west3.cockroachlabs.cloud:26257/defaultdb?sslmode=verify-full"
PORT=5001
NODE_ENV=development
JWT_SECRET=some_super_secret_key_123
CLOUDINARY_CLOUD_NAME=dsm2vj4s4
CLOUDINARY_API_KEY=949363234984442
CLOUDINARY_API_SECRET=Lg-T3n2q4L7k8n0t9Z8x4r2v6j0
ADMIN_EMAIL=z4ffwan77@gmail.com
`;

try {
    fs.writeFileSync(envPath, newContent, 'utf8');
    console.log('✅ Successfully updated .env file');
    console.log('New content written to:', envPath);
} catch (error) {
    console.error('❌ Failed to update .env file:', error);
}
