import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL + (process.env.DATABASE_URL?.includes('?') ? '&' : '?') + 'pgbouncer=true'
    }
  }
});

const TEST_PASSWORD = 'Welcome@1';

const testMatrix = [
  {
    plan: 'free',
    tenantName: 'Sample Lodge Free',
    tenantSlug: 'sample-lodge-free',
    users: [
      { email: 'owner-free@e2e.com', role: 'property_owner', name: 'Free Owner' },
      { email: 'staff-free@e2e.com', role: 'front_desk', name: 'Free Front Desk' },
    ],
    features: {}
  },
  {
    plan: 'basic',
    tenantName: 'Budget Hotel Basic',
    tenantSlug: 'budget-hotel-basic',
    users: [
      { email: 'owner-basic@e2e.com', role: 'property_owner', name: 'Basic Owner' },
      { email: 'manager-basic@e2e.com', role: 'general_manager', name: 'Basic GM' },
    ],
    features: {}
  },
  {
    plan: 'professional',
    tenantName: 'Premium Resort Pro',
    tenantSlug: 'premium-resort-pro',
    users: [
      { email: 'owner-premium@e2e.com', role: 'property_owner', name: 'Premium Owner' },
      { email: 'manager-premium@e2e.com', role: 'general_manager', name: 'Premium GM' },
      { email: 'desk-premium@e2e.com', role: 'front_desk', name: 'Premium Front Desk' },
      { email: 'housekeeping-premium@e2e.com', role: 'housekeeping', name: 'Premium Housekeeping' },
    ],
    features: {}
  }
];

const globalAdminUser = { email: 'global-admin@e2e.com', role: 'global_admin', name: 'Global Super Admin' };
const sampleGuest = { email: 'guest@e2e.com', role: 'guest', name: 'Frequent Guest' };

async function globalSetup() {
  const authDir = path.join(__dirname, '.auth');
  const cacheFile = path.join(authDir, 'users-data.json');
  
  if (fs.existsSync(cacheFile) && process.env.FORCE_RESEED !== 'true') {
    console.log('[Setup] Test matrix already seeded. Skipping to prevent race conditions...');
    return;
  }

  console.log('[Setup] Seeding test matrix...');
  
  const passwordHash = bcrypt.hashSync(TEST_PASSWORD, 12);
  const usersData: Record<string, any> = {};

  for (const matrix of testMatrix) {
    const createdUsers: Record<string, any> = {};
    for (const u of matrix.users) {
      createdUsers[u.email] = await prisma.globalUser.upsert({
        where: { email: u.email },
        update: { passwordHash, emailVerified: true },
        create: {
          email: u.email,
          passwordHash,
          fullName: u.name,
          phone: `+91${Math.floor(1000000000 + Math.random() * 9000000000)}`,
          emailVerified: true,
        }
      });
    }

    const ownerEmail = matrix.users.find(u => u.role === 'property_owner')?.email;
    if (!ownerEmail) throw new Error(`Matrix ${matrix.tenantName} missing owner.`);

    const tenant = await prisma.tenant.upsert({
      where: { slug: matrix.tenantSlug },
      update: {
        plan: matrix.plan,
        featureOverrides: matrix.features,
      },
      create: {
        name: matrix.tenantName,
        slug: matrix.tenantSlug,
        plan: matrix.plan,
        status: 'active',
        featureOverrides: matrix.features,
        schemaName: matrix.tenantSlug.replace(/-/g, '_'),
        owner: {
           connect: { email: ownerEmail }
        }
      }
    });

    for (const u of matrix.users) {
      const user = createdUsers[u.email];

      const existingMembership = await prisma.tenantMembership.findFirst({
        where: { userId: user.id, tenantId: tenant.id }
      });
      if (existingMembership) {
        await prisma.tenantMembership.update({
          where: { id: existingMembership.id },
          data: { role: u.role, isActive: true }
        });
      } else {
        await prisma.tenantMembership.create({
          data: {
            userId: user.id,
            tenantId: tenant.id,
            role: u.role,
            isActive: true
          }
        });
      }

      await prisma.guestPayment.deleteMany({ where: { tenantId: tenant.id } });
      await prisma.invoice.deleteMany({ where: { tenantId: tenant.id } });
      await prisma.folioCharge.deleteMany({ where: { tenantId: tenant.id } });
      await prisma.housekeepingTask.deleteMany({ where: { tenantId: tenant.id } });
      try { await (prisma as any).maintenanceTask.deleteMany({ where: { tenantId: tenant.id } }); } catch (e) {}
      await prisma.bookingRoom.deleteMany({ where: { tenantId: tenant.id } });
      await prisma.bookingGuest.deleteMany({ where: { tenantId: tenant.id } });
      await prisma.booking.deleteMany({ where: { tenantId: tenant.id } });
      await prisma.room.deleteMany({ where: { tenantId: tenant.id } });
      await prisma.roomType.deleteMany({ where: { tenantId: tenant.id } });
      await prisma.floor.deleteMany({ where: { tenantId: tenant.id } });

      const floor = await prisma.floor.create({
        data: { tenantId: tenant.id, name: 'Ground Floor', sortOrder: 0 }
      });
      const roomType = await prisma.roomType.create({
        data: { tenantId: tenant.id, name: 'Deluxe Room', slug: 'deluxe', baseRate: 2500, baseOccupancy: 2, maxOccupancy: 3 }
      });
      await prisma.room.create({
        data: { tenantId: tenant.id, floorId: floor.id, roomTypeId: roomType.id, roomNumber: '101' }
      });

      const populatedUser = await prisma.globalUser.findUnique({
        where: { email: u.email },
        include: {
          memberships: {
            where: { isActive: true },
            include: { tenant: { select: { name: true, slug: true, status: true, plan: true, featureOverrides: true } } },
          },
        },
      });

      if (populatedUser) {
        usersData[u.email] = populatedUser;
      }
    }
  }

  // Global Admin
  const globalAdmin = await prisma.globalUser.upsert({
    where: { email: globalAdminUser.email },
    update: { isGlobalAdmin: true, passwordHash, emailVerified: true },
    create: {
      email: globalAdminUser.email,
      passwordHash,
      fullName: globalAdminUser.name,
      phone: `+919999999999`,
      isGlobalAdmin: true,
      emailVerified: true,
    }
  });
  usersData[globalAdminUser.email] = { ...globalAdmin, memberships: [] };

  // Sample Guest
  const guestUser = await prisma.globalUser.upsert({
    where: { email: sampleGuest.email },
    update: { passwordHash, emailVerified: true },
    create: {
      email: sampleGuest.email,
      passwordHash,
      fullName: sampleGuest.name,
      phone: `+918888888888`,
      emailVerified: true,
    }
  });
  
  await prisma.guestProfile.upsert({
    where: { globalUserId: guestUser.id },
    update: { fullName: sampleGuest.name },
    create: {
      globalUserId: guestUser.id,
      fullName: sampleGuest.name,
      phone: `+918888888888`,
      email: sampleGuest.email
    }
  });
  usersData[sampleGuest.email] = { ...guestUser, memberships: [] };

  if (!fs.existsSync(authDir)) fs.mkdirSync(authDir, { recursive: true });

  fs.writeFileSync(path.join(authDir, 'users-data.json'), JSON.stringify(usersData, null, 2));
  console.log('[Setup] Test Matrix seeded successfully and cached for fixtures.');

  await prisma.$disconnect();
}

export default globalSetup;
