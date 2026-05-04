/**
 * sync-schema.js — Idempotent schema guard for production deployments.
 *
 * Ensures columns added to the Prisma schema are present in the database
 * before the API starts. Uses ADD COLUMN IF NOT EXISTS so it's safe to
 * re-run on every deploy.
 *
 * Usage: node sync-schema.js        (runs before `npm start` in production)
 *        npm run db:sync             (manual invocation)
 *
 * When you add a new column to schema.prisma, add the corresponding
 * ALTER TABLE statement here so it auto-applies on the next deploy.
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const MIGRATIONS = [
  // GuestPayment.paidOn — added for backdated payment recording
  `ALTER TABLE guest_payments ADD COLUMN IF NOT EXISTS paid_on TIMESTAMP(3) NOT NULL DEFAULT NOW()`,
];

async function main() {
  console.log('[sync-schema] Ensuring database columns are up to date…');
  for (const sql of MIGRATIONS) {
    try {
      await prisma.$executeRawUnsafe(sql);
      // Extract table + column for logging
      const match = sql.match(/ALTER TABLE (\S+) ADD COLUMN IF NOT EXISTS (\S+)/i);
      if (match) {
        console.log(`  ✔ ${match[1]}.${match[2]}`);
      }
    } catch (err) {
      console.error(`  ✘ Failed: ${sql}\n    ${err.message}`);
    }
  }
  console.log('[sync-schema] Done.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
