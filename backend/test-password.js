import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function testPassword() {
  try {
    const admin = await prisma.user.findUnique({
      where: { email: 'ronaldo@gmail.com' }
    });
    
    if (!admin) {
      console.log('Admin user not found');
      return;
    }
    
    console.log('Testing passwords...');
    
    // Test different passwords
    const passwords = ['safwan123', 'admin123', 'admin', 'password'];
    
    for (const password of passwords) {
      const isMatch = await bcrypt.compare(password, admin.password);
      console.log(`Password "${password}": ${isMatch ? '✅ MATCH' : '❌ NO MATCH'}`);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testPassword();