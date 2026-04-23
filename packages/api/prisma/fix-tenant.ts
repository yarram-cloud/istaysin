import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function fixTenant() {
  const user = await prisma.globalUser.findUnique({ where: { email: 's1@h.com' } });
  if (!user) return console.error('User not found');

  await prisma.tenantMembership.deleteMany({ where: { userId: user.id } });

  const premiumTenant = await prisma.tenant.findFirst({ where: { slug: 'premium-resort-pro' } });
  if (!premiumTenant) return console.error('Premium tenant not found');

  await prisma.tenantMembership.create({
    data: {
      userId: user.id,
      tenantId: premiumTenant.id,
      role: 'property_owner'
    }
  });
  console.log('Successfully moved s1@h.com to Premium Resort Pro.');
}

fixTenant().finally(() => prisma.$disconnect());
