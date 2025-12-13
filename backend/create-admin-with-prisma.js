import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createAdminWithPrisma() {
    try {
        console.log('🔧 Creating admin user with Prisma...\n');
        
        const adminEmail = 'z4fwan77@gmail.com';
        const adminPassword = 'admin123';
        const adminUsername = 'admin';
        
        console.log(`📧 Admin Email: ${adminEmail}`);
        console.log(`👤 Admin Username: ${adminUsername}`);
        console.log(`🔑 Admin Password: ${adminPassword}`);
        
        // Check if admin user already exists
        const existingAdmin = await prisma.user.findFirst({
            where: {
                OR: [
                    { email: adminEmail },
                    { username: adminUsername }
                ]
            }
        });
        
        if (existingAdmin) {
            console.log('\n👤 Admin user already exists, updating...');
            console.log(`   Current email: ${existingAdmin.email}`);
            console.log(`   Current username: ${existingAdmin.username}`);
            
            // Update the existing user
            const hashedPassword = await bcrypt.hash(adminPassword, 10);
            const updatedUser = await prisma.user.update({
                where: { id: existingAdmin.id },
                data: {
                    email: adminEmail,
                    username: adminUsername,
                    password: hashedPassword,
                    fullName: 'System Administrator',
                    nickname: 'Admin',
                    hasCompletedProfile: true,
                    isVerified: true,
                    bio: 'System Administrator',
                    country: 'System'
                }
            });
            
            console.log('✅ Admin user updated successfully!');
            console.log(`   ID: ${updatedUser.id}`);
        } else {
            console.log('\n👤 Creating new admin user...');
            
            // Hash password
            const hashedPassword = await bcrypt.hash(adminPassword, 10);
            
            // Create admin user with Prisma
            const adminUser = await prisma.user.create({
                data: {
                    email: adminEmail,
                    username: adminUsername,
                    fullName: 'System Administrator',
                    nickname: 'Admin',
                    password: hashedPassword,
                    hasCompletedProfile: true,
                    isVerified: true,
                    bio: 'System Administrator',
                    country: 'System',
                    profilePic: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin'
                }
            });
            
            console.log('✅ Admin user created successfully!');
            console.log(`   ID: ${adminUser.id}`);
            console.log(`   Email: ${adminUser.email}`);
            console.log(`   Username: ${adminUser.username}`);
        }
        
        // Test the login process
        console.log('\n🔍 Testing login process...');
        
        // Find user (same as auth controller)
        let user = await prisma.user.findUnique({
            where: { email: adminEmail }
        });
        
        if (!user) {
            user = await prisma.user.findUnique({
                where: { username: adminUsername }
            });
        }
        
        if (user) {
            console.log('✅ User found via Prisma');
            const isPasswordValid = await bcrypt.compare(adminPassword, user.password);
            console.log(`🔑 Password valid: ${isPasswordValid ? '✅ YES' : '❌ NO'}`);
            
            console.log('\n📋 User details:');
            console.log(`   ID: ${user.id}`);
            console.log(`   Email: ${user.email}`);
            console.log(`   Username: ${user.username}`);
            console.log(`   Full Name: ${user.fullName}`);
            console.log(`   Profile Complete: ${user.hasCompletedProfile}`);
            console.log(`   Verified: ${user.isVerified}`);
            console.log(`   Blocked: ${user.isBlocked}`);
            console.log(`   Suspended: ${user.isSuspended}`);
        } else {
            console.log('❌ User not found after creation');
        }
        
        console.log('\n🎯 ADMIN SETUP COMPLETE!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📧 Email:', adminEmail);
        console.log('🔑 Password:', adminPassword);
        console.log('🌐 Login URL: http://localhost:5173/login');
        console.log('👑 Admin Panel: http://localhost:5173/admin');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        
    } catch (error) {
        console.error('❌ Error creating admin with Prisma:', error);
    } finally {
        await prisma.$disconnect();
    }
}

createAdminWithPrisma();