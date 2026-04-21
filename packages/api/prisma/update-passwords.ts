import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function update() {
  const hash = await bcrypt.hash('12345678', 12);
  await prisma.globalUser.updateMany({ data: { passwordHash: hash } });
  console.log('Passwords reset to 12345678 for all users for testing');
}

update().finally(() => prisma.$disconnect());
