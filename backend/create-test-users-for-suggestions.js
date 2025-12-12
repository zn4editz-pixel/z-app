import prisma from './src/lib/prisma.js';
import bcrypt from 'bcryptjs';

async function createTestUsersForSuggestions() {
    try {
        console.log('👥 CREATING TEST USERS FOR SUGGESTED USERS SECTION...\n');
        
        // 1. Check current users
        console.log('1️⃣ Checking current users...');
        const currentUsers = await prisma.user.findMany({
            select: {
                id: true,
                username: true,
                email: true,
                hasCompletedProfile: true,
                isVerified: true
            }
        });
        
        console.log(`   Current users: ${currentUsers.length}`);
        currentUsers.forEach(user => {
            console.log(`     ${user.username} (${user.email}) - Profile Complete: ${user.hasCompletedProfile}`);
        });
        
        // 2. Update existing test user to have completed profile
        console.log('\n2️⃣ Updating existing test user...');
        try {
            const testUser = await prisma.user.findFirst({
                where: { email: 'testuser@example.com' }
            });
            
            if (testUser) {
                await prisma.user.update({
                    where: { id: testUser.id },
                    data: {
                        hasCompletedProfile: true,
                        bio: 'I am a test user for the chat application!',
                        country: 'Test Country',
                        countryCode: 'TC',
                        city: 'Test City'
                    }
                });
                console.log('   ✅ Updated existing test user profile');
            }
        } catch (error) {
            console.log('   ⚠️ No existing test user found');
        }
        
        // 3. Create additional test users
        console.log('\n3️⃣ Creating additional test users...');
        
        const testUsers = [
            {
                fullName: 'Alice Johnson',
                email: 'alice@example.com',
                username: 'alice_j',
                nickname: 'Alice',
                bio: 'Love photography and traveling! 📸✈️',
                country: 'United States',
                countryCode: 'US',
                city: 'New York'
            },
            {
                fullName: 'Bob Smith',
                email: 'bob@example.com',
                username: 'bob_smith',
                nickname: 'Bob',
                bio: 'Software developer and coffee enthusiast ☕💻',
                country: 'Canada',
                countryCode: 'CA',
                city: 'Toronto'
            },
            {
                fullName: 'Carol Davis',
                email: 'carol@example.com',
                username: 'carol_d',
                nickname: 'Carol',
                bio: 'Artist and nature lover 🎨🌿',
                country: 'United Kingdom',
                countryCode: 'GB',
                city: 'London'
            },
            {
                fullName: 'David Wilson',
                email: 'david@example.com',
                username: 'david_w',
                nickname: 'David',
                bio: 'Fitness trainer and healthy lifestyle advocate 💪🥗',
                country: 'Australia',
                countryCode: 'AU',
                city: 'Sydney'
            },
            {
                fullName: 'Emma Brown',
                email: 'emma@example.com',
                username: 'emma_b',
                nickname: 'Emma',
                bio: 'Book lover and aspiring writer 📚✍️',
                country: 'Germany',
                countryCode: 'DE',
                city: 'Berlin'
            },
            {
                fullName: 'Frank Miller',
                email: 'frank@example.com',
                username: 'frank_m',
                nickname: 'Frank',
                bio: 'Music producer and guitar player 🎵🎸',
                country: 'France',
                countryCode: 'FR',
                city: 'Paris'
            }
        ];
        
        let createdCount = 0;
        const defaultPassword = await bcrypt.hash('password123', 10);
        
        for (const userData of testUsers) {
            try {
                // Check if user already exists
                const existingUser = await prisma.user.findFirst({
                    where: {
                        OR: [
                            { email: userData.email },
                            { username: userData.username }
                        ]
                    }
                });
                
                if (existingUser) {
                    console.log(`   ⚠️ User ${userData.username} already exists, skipping`);
                    continue;
                }
                
                const newUser = await prisma.user.create({
                    data: {
                        ...userData,
                        password: defaultPassword,
                        profilePic: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userData.username}`,
                        hasCompletedProfile: true,
                        isVerified: Math.random() > 0.5, // Randomly verify some users
                        isOnline: Math.random() > 0.7 // Some users online
                    }
                });
                
                createdCount++;
                console.log(`   ✅ Created: ${newUser.fullName} (@${newUser.username})`);
                
            } catch (error) {
                console.log(`   ❌ Failed to create ${userData.username}: ${error.message}`);
            }
        }
        
        // 4. Verify the results
        console.log('\n4️⃣ Verifying results...');
        
        const finalUsers = await prisma.user.findMany({
            where: { hasCompletedProfile: true },
            select: {
                id: true,
                username: true,
                fullName: true,
                email: true,
                hasCompletedProfile: true,
                isVerified: true,
                bio: true,
                country: true
            }
        });
        
        console.log(`   Total users with completed profiles: ${finalUsers.length}`);
        console.log('\n   Users available for suggestions:');
        finalUsers.forEach((user, index) => {
            const isAdmin = user.email === 'z4fwan77@gmail.com';
            console.log(`     ${index + 1}. ${user.fullName} (@${user.username}) ${isAdmin ? '👑 ADMIN' : ''} ${user.isVerified ? '✅' : ''}`);
            console.log(`        Bio: ${user.bio || 'No bio'}`);
            console.log(`        Location: ${user.country}`);
        });
        
        console.log('\n🎉 TEST USERS CREATION COMPLETE!');
        console.log('=====================================');
        console.log(`✅ Created ${createdCount} new test users`);
        console.log(`✅ Total users with completed profiles: ${finalUsers.length}`);
        console.log(`✅ Suggested users section should now show ${finalUsers.length - 1} users (excluding admin)`);
        console.log('\n🚀 REFRESH YOUR FRONTEND TO SEE SUGGESTED USERS!');
        
    } catch (error) {
        console.error('❌ Error creating test users:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

createTestUsersForSuggestions();