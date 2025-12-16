
const fs = require('fs');
const path = require('path');

const envContent = `MONGODB_URI=mongodb+srv://z4fwan77:OCc9YMeaZxBf5gRi@cluster0.9rlfy9u.mongodb.net/chat_db?retryWrites=true&w=majority&appName=Cluster0
DATABASE_URL=postgresql://s4fwan_x:tZrL_-MUluvmSdrFNEy5rw@iron-orc-11183.jxf.gcp-europe-west3.cockroachlabs.cloud:26257/defaultdb?sslmode=verify-full

PORT=5001
JWT_SECRET=myscretkey
NODE_ENV=development
CLOUDINARY_CLOUD_NAME=dsol2p21u
CLOUDINARY_API_KEY=455557543893756
CLOUDINARY_API_SECRET=MyvMZN6iRSisWvX5SL-tDMsWCv4
ADMIN_EMAIL=z4fwan77@gmail.com
EMAIL_USER=z4fwan77@gmail.com
EMAIL_PASS=adpl whrp rkmg glrv
ADMIN_USERNAME=admin
CLIENT_URL=http://localhost:5173
FRONTEND_URL=http://localhost:5173
`;

const envPath = path.join(__dirname, '..', '.env');

try {
    fs.writeFileSync(envPath, envContent, 'utf8');
    console.log("✅ .env file successfully overwritten.");
} catch (error) {
    console.error("❌ Failed to write .env:", error);
}
