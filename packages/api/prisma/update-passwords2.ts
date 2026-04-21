import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function update() {
  const hash = await bcrypt.hash('Admin@2026', 12);
  await prisma.globalUser.updateMany({ data: { passwordHash: hash } });
  console.log('Passwords reset back to Admin@2026');
}

update().finally(() => prisma.$disconnect());
