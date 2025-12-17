
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function check() {
    const users = await prisma.user.findMany({
        where: {
            OR: [
                { username: { contains: 'admin' } },
                { nickname: { contains: 'admin' } },
                { fullName: { contains: 'admin' } }
            ]
        },
        select: { id: true, username: true, nickname: true, fullName: true }
    });
    console.log('Found users:', users);
}

check()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
