const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function setupDatabase() {
    try {
        console.log('🗄️ Setting up SQLite database...');
        
        // Test database connection
        await prisma.$connect();
        console.log('✅ Database connected successfully!');
        
        // Check if admin user exists
        const existingAdmin = await prisma.user.findUnique({
            where: { email: 'ronaldo@gmail.com' }
        });
        
        if (existingAdmin) {
            console.log('👤 Admin user already exists!');
            console.log('📧 Email:', existingAdmin.email);
            console.log('👤 Username:', existingAdmin.username);
            return;
        }
        
        // Create admin user
        console.log('👤 Creating admin user...');
        const hashedPassword = await bcrypt.hash('safwan123', 12);
        
        const adminUser = await prisma.user.create({
            data: {
                fullName: 'Admin User',
                email: 'ronaldo@gmail.com',
                username: 'admin',
                nickname: 'Admin',
                password: hashedPassword,
                bio: 'System Administrator',
                isVerified: true,
                hasCompletedProfile: true,
                country: 'System',
                countryCode: 'SYS',
                city: 'Admin Panel',
                isOnline: true
            }
        });
        
        console.log('✅ Admin user created successfully!');
        console.log('📧 Email: ronaldo@gmail.com');
        console.log('🔑 Password: safwan123');
        console.log('👤 Username: admin');
        
        // Create some sample data for testing
        console.log('📊 Creating sample data...');
        
        // Create sample users
        const sampleUsers = [
            {
                fullName: 'John Doe',
                email: 'john@example.com',
                username: 'johndoe',
                nickname: 'John',
                password: await bcrypt.hash('password123', 12),
                country: 'United States',
                countryCode: 'US',
                city: 'New York',
                hasCompletedProfile: true
            },
            {
                fullName: 'Jane Smith',
                email: 'jane@example.com',
                username: 'janesmith',
                nickname: 'Jane',
                password: await bcrypt.hash('password123', 12),
                country: 'Canada',
                countryCode: 'CA',
                city: 'Toronto',
                hasCompletedProfile: true,
                isVerified: true
            }
        ];
        
        for (const userData of sampleUsers) {
            await prisma.user.create({ data: userData });
        }
        
        // Create sample reports
        const users = await prisma.user.findMany();
        if (users.length >= 3) {
            await prisma.report.create({
                data: {
                    reporterId: users[1].id,
                    reportedUserId: users[2].id,
                    reason: 'Inappropriate content',
                    description: 'User posted inappropriate images',
                    status: 'pending',
                    isAIDetected: true,
                    aiCategory: 'inappropriate_content',
                    aiConfidence: 0.85,
                    severity: 'high'
                }
            });
        }
        
        // Create admin notifications
        await prisma.adminNotification.create({
            data: {
                type: 'system',
                title: 'Database Setup Complete',
                message: 'SQLite database has been successfully configured with sample data.',
                isRead: false
            }
        });
        
        console.log('✅ Sample data created successfully!');
        console.log('📊 Database is ready for use!');
        
    } catch (error) {
        console.error('❌ Database setup failed:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Run setup
setupDatabase()
    .then(() => {
        console.log('🎉 Database setup completed successfully!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('💥 Setup failed:', error);
        process.exit(1);
    });