import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkUser() {
  try {
    const users = await prisma.user.findMany();
    console.log('All users in database:');
    users.forEach(user => {
      console.log(`- ID: ${user.id}`);
      console.log(`- Email: ${user.email}`);
      console.log(`- Username: ${user.username}`);
      console.log(`- Password Hash: ${user.password.substring(0, 20)}...`);
      console.log(`- Created: ${user.createdAt}`);
      console.log('---');
    });
    
    // Try to find the admin user specifically
    const admin = await prisma.user.findUnique({
      where: { email: 'ronaldo@gmail.com' }
    });
    
    if (admin) {
      console.log('Admin user found:', admin.email);
    } else {
      console.log('Admin user NOT found');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUser();