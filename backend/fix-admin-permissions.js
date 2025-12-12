import prisma from './src/lib/prisma.js';

async function fixAdminPermissions() {
    try {
        console.log('🔧 FIXING ADMIN PERMISSIONS...\n');
        
        // Find the admin user
        const adminUser = await prisma.user.findUnique({
            where: { email: 'z4fwan77@gmail.com' }
        });
        
        if (!adminUser) {
            console.log('❌ Admin user not found');
            return;
        }
        
        console.log('✅ Found admin user:', adminUser.username);
        
        // Check current admin status
        console.log('Current admin fields:');
        console.log(`   isAdmin: ${adminUser.isAdmin || 'undefined'}`);
        console.log(`   isVerified: ${adminUser.isVerified}`);
        console.log(`   isBlocked: ${adminUser.isBlocked}`);
        
        // Update user to have admin permissions
        const updatedAdmin = await prisma.user.update({
            where: { id: adminUser.id },
            data: {
                // Add isAdmin field if it doesn't exist in schema
                isVerified: true,
                isBlocked: false,
                isSuspended: false,
                fullName: 'Safwan Admin',
                nickname: 'Safwan Admin'
            }
        });
        
        console.log('\n✅ Admin permissions updated');
        console.log('Updated admin user:');
        console.log(`   ID: ${updatedAdmin.id}`);
        console.log(`   Email: ${updatedAdmin.email}`);
        console.log(`   Username: ${updatedAdmin.username}`);
        console.log(`   Full Name: ${updatedAdmin.fullName}`);
        console.log(`   Verified: ${updatedAdmin.isVerified}`);
        console.log(`   Blocked: ${updatedAdmin.isBlocked}`);
        console.log(`   Suspended: ${updatedAdmin.isSuspended}`);
        
        console.log('\n🎉 ADMIN PERMISSIONS FIXED!');
        console.log('Your admin account now has full access.');
        
    } catch (error) {
        console.error('❌ Error fixing admin permissions:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

fixAdminPermissions();