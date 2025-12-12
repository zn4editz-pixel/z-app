import prisma from './src/lib/prisma.js';
import bcrypt from 'bcryptjs';

async function fixAdminPassword() {
    try {
        console.log('🔧 Fixing admin password...\n');
        
        const adminEmail = 'ronaldo@gmail.com';
        const admin = await prisma.user.findUnique({ 
            where: { email: adminEmail } 
        });
        
        if (!admin) {
            console.log('❌ Admin user not found');
            return;
        }
        
        console.log('✅ Admin found:', admin.email);
        console.log('Current password hash:', admin.password.substring(0, 20) + '...');
        
        // Test current password
        const isCurrentMatch = await bcrypt.compare('admin123', admin.password);
        console.log('Current password "admin123" matches:', isCurrentMatch);
        
        // Update password to ensure it works
        const newHash = await bcrypt.hash('admin123', 10);
        await prisma.user.update({
            where: { id: admin.id },
            data: { password: newHash }
        });
        
        console.log('✅ Password updated successfully');
        
        // Verify new password
        const updatedAdmin = await prisma.user.findUnique({ 
            where: { email: adminEmail } 
        });
        const isNewMatch = await bcrypt.compare('admin123', updatedAdmin.password);
        console.log('New password "admin123" matches:', isNewMatch);
        
        console.log('\n🎉 Admin password fixed!');
        console.log('Login credentials:');
        console.log('  Email: ronaldo@gmail.com');
        console.log('  Password: admin123');
        
    } catch (error) {
        console.error('❌ Error fixing admin password:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

fixAdminPassword();