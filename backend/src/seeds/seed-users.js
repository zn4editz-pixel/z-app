import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { config } from 'dotenv';

config();

const prisma = new PrismaClient();

const seedUsers = [
  // Admin Users
  {
    email: "ronaldo@gmail.com",
    fullName: "Ronaldo",
    username: "ronaldo",
    password: "safwan123",
    profilePic: "https://randomuser.me/api/portraits/men/99.jpg",
    hasCompletedProfile: true,
    isVerified: true,
  },
  {
    email: "z4fwan77@gmail.com",
    fullName: "Z4fwan",
    username: "z4fwan",
    password: "safwan123",
    profilePic: "https://randomuser.me/api/portraits/men/98.jpg",
    hasCompletedProfile: true,
    isVerified: true,
  },

  // Female Users
  {
    email: "emma.thompson@example.com",
    fullName: "Emma Thompson",
    username: "emma_thompson",
    password: "123456",
    profilePic: "https://randomuser.me/api/portraits/women/1.jpg",
    hasCompletedProfile: true,
  },
  {
    email: "olivia.miller@example.com",
    fullName: "Olivia Miller",
    username: "olivia_miller",
    password: "123456",
    profilePic: "https://randomuser.me/api/portraits/women/2.jpg",
    hasCompletedProfile: true,
  },
  {
    email: "sophia.davis@example.com",
    fullName: "Sophia Davis",
    username: "sophia_davis",
    password: "123456",
    profilePic: "https://randomuser.me/api/portraits/women/3.jpg",
    hasCompletedProfile: true,
  },

  // Male Users
  {
    email: "james.anderson@example.com",
    fullName: "James Anderson",
    username: "james_anderson",
    password: "123456",
    profilePic: "https://randomuser.me/api/portraits/men/1.jpg",
    hasCompletedProfile: true,
  },
  {
    email: "william.clark@example.com",
    fullName: "William Clark",
    username: "william_clark",
    password: "123456",
    profilePic: "https://randomuser.me/api/portraits/men/2.jpg",
    hasCompletedProfile: true,
  },
  {
    email: "benjamin.taylor@example.com",
    fullName: "Benjamin Taylor",
    username: "benjamin_taylor",
    password: "123456",
    profilePic: "https://randomuser.me/api/portraits/men/3.jpg",
    hasCompletedProfile: true,
  },
];

const seedDatabase = async () => {
  try {
    console.log('🌱 Starting database seeding...');

    // Clear existing data
    console.log('🗑️  Clearing existing data...');
    await prisma.message.deleteMany();
    await prisma.friendRequest.deleteMany();
    await prisma.report.deleteMany();
    await prisma.adminNotification.deleteMany();
    await prisma.user.deleteMany();

    // Hash passwords and create users
    console.log('👥 Creating users...');
    for (const userData of seedUsers) {
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      
      await prisma.user.create({
        data: {
          ...userData,
          password: hashedPassword,
        }
      });
      
      console.log(`✅ Created user: ${userData.email}`);
    }

    console.log('\n🎉 Database seeded successfully!');
    console.log(`📊 Created ${seedUsers.length} users`);
    console.log('\n📝 Admin accounts:');
    console.log('   - ronaldo@gmail.com / safwan123');
    console.log('   - z4fwan77@gmail.com / safwan123');
    console.log('\n📝 Test accounts:');
    console.log('   - Any user above / 123456');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
};

// Run seeding
seedDatabase()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
