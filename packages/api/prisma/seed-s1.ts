import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function run() {
  const t = await prisma.tenant.findFirst();
  if (!t) {
    console.error('No tenants found!');
    return;
  }
  const hash = await bcrypt.hash('12345678', 12);
  const u = await prisma.globalUser.upsert({
    where: { email: 's1@h.com' },
    update: { passwordHash: hash },
    create: {
      email: 's1@h.com',
      passwordHash: hash,
      fullName: 's1 User',
      emailVerified: true
    }
  });

  const membership = await prisma.tenantMembership.findFirst({
    where: { userId: u.id, tenantId: t.id }
  });

  if (!membership) {
    await prisma.tenantMembership.create({
      data: {
        userId: u.id,
        tenantId: t.id,
        role: 'property_owner'
      }
    });
  }

  console.log('CREATED/RESTORED s1@h.com');
}

run().finally(() => prisma.$disconnect());
