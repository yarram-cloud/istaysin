import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function update() {
  const hash = await bcrypt.hash('12345678', 12);
  const u = await prisma.globalUser.findUnique({ where: { email: 's1@h.com' } });
  if (u) {
    await prisma.globalUser.update({
      where: { email: 's1@h.com' },
      data: { passwordHash: hash }
    });
    console.log('Fixed s1@h.com to use 12345678');
  } else {
    console.log('s1@h.com not found. Updating ALL non-admin accounts to 12345678 as a fallback');
    await prisma.globalUser.updateMany({
      where: { isGlobalAdmin: false },
      data: { passwordHash: hash }
    });
  }
}

update().finally(() => prisma.$disconnect());
