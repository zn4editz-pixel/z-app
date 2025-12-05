import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load backend .env
dotenv.config({ path: path.join(__dirname, '.env') });

const userSchema = new mongoose.Schema({}, { strict: false });
const User = mongoose.model('User', userSchema);

async function checkUsers() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');
        
        const users = await User.find({}).select('username email fullName isAdmin');
        console.log('\n📋 Users in database:');
        console.log(JSON.stringify(users, null, 2));
        
        const adminEmail = process.env.ADMIN_EMAIL;
        console.log(`\n🔍 Looking for admin with email: ${adminEmail}`);
        
        const admin = await User.findOne({ email: adminEmail });
        if (admin) {
            console.log('\n✅ Admin found:');
            console.log(`   Username: ${admin.username}`);
            console.log(`   Email: ${admin.email}`);
            console.log(`   Full Name: ${admin.fullName}`);
            console.log(`   Is Admin: ${admin.isAdmin}`);
        } else {
            console.log('\n❌ Admin not found!');
        }
        
        await mongoose.disconnect();
        console.log('\n✅ Disconnected from MongoDB');
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

checkUsers();
