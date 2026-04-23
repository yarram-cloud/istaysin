import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function check() {
  const u = await prisma.globalUser.findUnique({
    where: { email: 's1@h.com' },
    include: {
      memberships: {
        include: {
          tenant: {
            include: {
              _count: { select: { bookings: true } }
            }
          }
        }
      }
    }
  });
  console.dir(u, { depth: null });
  
  const tenants = await prisma.tenant.findMany({
    include: { _count: { select: { bookings: true } } }
  });
  console.log('\nAll Tenants:');
  console.dir(tenants, { depth: null });
}

check().finally(() => prisma.$disconnect());
