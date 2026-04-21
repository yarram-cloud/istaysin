/**
 * Seed script — Creates the global admin account for istaysin platform.
 *
 * Usage:
 *   npx ts-node prisma/seed.ts
 *   — or —
 *   npx prisma db seed
 *
 * Default admin credentials (change password after first login!):
 *   Email:    admin@istaysin.com
 *   Password: 12345678
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding istaysin database...\n');

  // ── 1. Global Admin ──────────────────────────────────────
  const adminEmail = 'admin@istaysin.com';
  const adminPassword = '12345678';

  const existingAdmin = await prisma.globalUser.findUnique({
    where: { email: adminEmail },
  });

  if (existingAdmin) {
    // Ensure isGlobalAdmin flag is set
    if (!existingAdmin.isGlobalAdmin) {
      await prisma.globalUser.update({
        where: { id: existingAdmin.id },
        data: { isGlobalAdmin: true },
      });
      console.log(`✅ Admin flag set on existing user: ${adminEmail}`);
    } else {
      console.log(`⏭️  Admin already exists: ${adminEmail}`);
    }
  } else {
    const passwordHash = await bcrypt.hash(adminPassword, 12);
    await prisma.globalUser.create({
      data: {
        email: adminEmail,
        passwordHash,
        fullName: 'Platform Admin',
        isGlobalAdmin: true,
        emailVerified: true,
      },
    });
    console.log(`✅ Admin created: ${adminEmail} / ${adminPassword}`);
  }

  // ── 2. Platform Settings ─────────────────────────────────
  const settings = await prisma.platformSettings.findUnique({
    where: { id: 'global' },
  });

  if (!settings) {
    await prisma.platformSettings.create({
      data: {
        id: 'global',
        config: {
          platformName: 'istaysin',
          supportEmail: 'support@istaysin.com',
          autoApproveProperties: false,
          defaultPlan: 'free',
          trialDays: 14,
        },
      },
    });
    console.log('✅ Platform settings created');
  } else {
    console.log('⏭️  Platform settings already exist');
  }

  console.log('\n🎉 Seed complete!');
  console.log('───────────────────────────────────────');
  console.log('Admin login:');
  console.log(`  Email:    ${adminEmail}`);
  console.log(`  Password: ${adminPassword}`);
  console.log('  ⚠️  Change password after first login!');
  console.log('───────────────────────────────────────');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
