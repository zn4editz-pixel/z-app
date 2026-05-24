import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import 'dotenv/config';

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  const username = process.env.ADMIN_USERNAME || 'admin';

  if (!email || !password) {
    console.error('❌ Error: ADMIN_EMAIL and ADMIN_PASSWORD must be set in .env');
    process.exit(1);
  }

  console.log(`🔧 Creating/Updating Admin User...`);
  console.log(`   Email: ${email}`);
  console.log(`   Username: ${username}`);

  try {
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      console.log('   🔄 Admin user already exists. Updating password and roles...');
      await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          password: hashedPassword,
          username: username.toLowerCase(),
          isVerified: true,
          hasCompletedProfile: true,
        },
      });
      console.log('   ✅ Admin user updated successfully.');
    } else {
      console.log('   🆕 Admin user does not exist. Creating new user...');
      // Ensure username is unique
      const existingUsername = await prisma.user.findUnique({
        where: { username: username.toLowerCase() },
      });

      const finalUsername = existingUsername 
        ? `${username.toLowerCase()}_admin` 
        : username.toLowerCase();

      await prisma.user.create({
        data: {
          fullName: 'Safwan Admin',
          username: finalUsername,
          email: email,
          password: hashedPassword,
          nickname: 'Safwan',
          hasCompletedProfile: true,
          isVerified: true,
          bio: 'System Administrator',
        },
      });
      console.log('   ✅ Admin user created successfully.');
    }
  } catch (error) {
    console.error('❌ Error seeding/updating admin user:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
