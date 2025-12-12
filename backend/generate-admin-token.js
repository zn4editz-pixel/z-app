import prisma from './src/lib/prisma.js';
import jwt from 'jsonwebtoken';

async function generateAdminToken() {
    try {
        // Find admin user
        const admin = await prisma.user.findFirst({
            where: {
                OR: [
                    { username: 'admin' },
                    { email: 'ronaldo@gmail.com' }
                ]
            }
        });
        
        if (!admin) {
            console.log('❌ Admin user not found');
            return;
        }
        
        console.log(`👤 Admin found: ${admin.fullName} (@${admin.username})`);
        
        // Generate JWT token
        const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
        const token = jwt.sign({ userId: admin.id }, JWT_SECRET, { expiresIn: '7d' });
        
        console.log(`🔑 Admin Token: ${token}`);
        console.log('\n📝 Test admin API:');
        console.log(`curl -H "Authorization: Bearer ${token}" http://localhost:5001/api/admin/users`);
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

generateAdminToken();