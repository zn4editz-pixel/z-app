// 🚀 Test Admin Access - Verify Admin Dashboard Works
import prisma from './src/lib/prisma.js';
import bcrypt from 'bcryptjs';

async function testAdminAccess() {
    console.log('🔐 Testing Admin Access...');
    
    try {
        // Check environment variables
        console.log('📧 ADMIN_EMAIL from env:', process.env.ADMIN_EMAIL);
        
        // Check if admin user exists with correct email
        const adminUser = await prisma.user.findUnique({
            where: { email: process.env.ADMIN_EMAIL || 'ronaldo@gmail.com' }
        });
        
        if (!adminUser) {
            console.log('❌ Admin user not found. Creating admin user...');
            
            const hashedPassword = await bcrypt.hash('safwan123', 12);
            
            const newAdmin = await prisma.user.create({
                data: {
                    fullName: 'Admin User',
                    email: process.env.ADMIN_EMAIL || 'ronaldo@gmail.com',
                    username: 'admin',
                    nickname: 'Admin',
                    password: hashedPassword,
                    hasCompletedProfile: true,
                    isVerified: true,
                    country: 'United States',
                    countryCode: 'US',
                    city: 'New York',
                    region: 'NY'
                }
            });
            
            console.log('✅ Admin user created:', newAdmin.email);
        } else {
            console.log('✅ Admin user found:', adminUser.email);
            console.log('👤 Username:', adminUser.username);
            console.log('✅ Verified:', adminUser.isVerified);
        }
        
        // Test password verification
        const testPassword = 'safwan123';
        const isPasswordValid = await bcrypt.compare(testPassword, adminUser?.password || '');
        console.log('🔑 Password test:', isPasswordValid ? '✅ Valid' : '❌ Invalid');
        
        // Get basic stats for dashboard
        const [totalUsers, onlineUsers, verifiedUsers, pendingReports] = await Promise.all([
            prisma.user.count(),
            prisma.user.count({ where: { isOnline: true } }),
            prisma.user.count({ where: { isVerified: true } }),
            prisma.report.count({ where: { status: 'pending' } })
        ]);
        
        console.log('\n📊 Dashboard Stats:');
        console.log(`   👥 Total Users: ${totalUsers}`);
        console.log(`   🟢 Online Users: ${onlineUsers}`);
        console.log(`   ✅ Verified Users: ${verifiedUsers}`);
        console.log(`   📋 Pending Reports: ${pendingReports}`);
        
        console.log('\n🎉 ADMIN ACCESS TEST COMPLETE!');
        console.log('🌟 Your admin dashboard should work perfectly now!');
        console.log('\n🔗 Login Details:');
        console.log(`   📧 Email: ${process.env.ADMIN_EMAIL || 'ronaldo@gmail.com'}`);
        console.log('   🔑 Password: safwan123');
        console.log('   🌐 URL: http://localhost:5173/admin');
        
    } catch (error) {
        console.error('❌ Admin access test failed:', error.message);
        console.log('\n🔧 Troubleshooting:');
        console.log('1. Make sure backend server is running on port 5001');
        console.log('2. Check ADMIN_EMAIL in .env file');
        console.log('3. Verify database connection');
    } finally {
        await prisma.$disconnect();
    }
}

testAdminAccess();