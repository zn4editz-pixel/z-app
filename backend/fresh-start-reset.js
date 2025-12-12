import prisma from './src/lib/prisma.js';
import bcrypt from 'bcryptjs';

async function freshStartReset() {
    try {
        console.log('🧹 FRESH START - CLEARING ALL DATABASE DATA...\n');
        
        // 1. Clear all existing data
        console.log('1️⃣ Clearing all existing data...');
        
        await prisma.adminNotification.deleteMany({});
        console.log('   ✅ Cleared admin notifications');
        
        await prisma.report.deleteMany({});
        console.log('   ✅ Cleared reports');
        
        await prisma.message.deleteMany({});
        console.log('   ✅ Cleared messages');
        
        await prisma.friendRequest.deleteMany({});
        console.log('   ✅ Cleared friend requests');
        
        await prisma.user.deleteMany({});
        console.log('   ✅ Cleared users');
        
        // 2. Verify database is empty
        console.log('\n2️⃣ Verifying database is completely empty...');
        const counts = {
            users: await prisma.user.count(),
            messages: await prisma.message.count(),
            friendRequests: await prisma.friendRequest.count(),
            reports: await prisma.report.count(),
            adminNotifications: await prisma.adminNotification.count()
        };
        
        console.log('   Database counts:');
        Object.entries(counts).forEach(([table, count]) => {
            console.log(`     ${table}: ${count} ${count === 0 ? '✅' : '❌'}`);
        });
        
        const isEmpty = Object.values(counts).every(count => count === 0);
        
        if (!isEmpty) {
            throw new Error('Database not completely cleared');
        }
        
        console.log('   ✅ Database is completely empty');
        
        // 3. Create fresh admin user with your email
        console.log('\n3️⃣ Creating fresh admin user...');
        
        const adminPassword = 'admin123';
        const hashedPassword = await bcrypt.hash(adminPassword, 10);
        
        const newAdmin = await prisma.user.create({
            data: {
                fullName: 'Safwan Admin',
                email: 'z4fwan77@gmail.com',
                username: 'safwan',
                nickname: 'Safwan',
                password: hashedPassword,
                profilePic: 'https://api.dicebear.com/7.x/avataaars/svg?seed=safwan',
                hasCompletedProfile: true,
                isVerified: true,
                country: 'Admin Country',
                countryCode: 'AD',
                city: 'Admin City'
            }
        });
        
        console.log('   ✅ Fresh admin user created successfully');
        console.log(`   ID: ${newAdmin.id}`);
        console.log(`   Email: ${newAdmin.email}`);
        console.log(`   Username: ${newAdmin.username}`);
        
        // 4. Test the new admin login
        console.log('\n4️⃣ Testing new admin credentials...');
        
        const testPassword = await bcrypt.compare(adminPassword, newAdmin.password);
        console.log(`   Password test: ${testPassword ? '✅ WORKING' : '❌ FAILED'}`);
        
        // 5. Final verification
        console.log('\n5️⃣ Final verification...');
        
        const finalCounts = {
            users: await prisma.user.count(),
            messages: await prisma.message.count(),
            friendRequests: await prisma.friendRequest.count(),
            reports: await prisma.report.count(),
            adminNotifications: await prisma.adminNotification.count()
        };
        
        console.log('   Final database state:');
        Object.entries(finalCounts).forEach(([table, count]) => {
            console.log(`     ${table}: ${count}`);
        });
        
        console.log('\n🎉 FRESH START COMPLETE!');
        console.log('=====================================');
        console.log('✅ Database completely cleared');
        console.log('✅ Fresh admin user created');
        console.log('✅ All systems ready for fresh start');
        console.log('\n👑 YOUR NEW ADMIN CREDENTIALS:');
        console.log('🔑 Email: z4fwan77@gmail.com');
        console.log('🔑 Username: safwan');
        console.log('🔑 Password: admin123');
        console.log('\n🚀 Ready for bug-free fresh start!');
        console.log('   - 0 users (except admin)');
        console.log('   - 0 messages');
        console.log('   - 0 friend requests');
        console.log('   - Clean database with no legacy issues');
        
    } catch (error) {
        console.error('❌ Fresh start error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

freshStartReset();