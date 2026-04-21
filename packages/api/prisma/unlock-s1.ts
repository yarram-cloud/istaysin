import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function unlock() {
  await prisma.globalUser.update({
    where: { email: 's1@h.com' },
    data: { failedLoginAttempts: 0, lockedUntil: null }
  });
  console.log('Unlocked s1@h.com');
}

unlock().finally(() => prisma.$disconnect());
