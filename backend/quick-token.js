import prisma from './src/lib/prisma.js';
import jwt from 'jsonwebtoken';

const user = await prisma.user.findFirst({where: {username: 'test'}});
const token = jwt.sign({userId: user.id}, 'myscretkey', {expiresIn: '1h'});
console.log(token);
await prisma.$disconnect();