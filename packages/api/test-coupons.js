const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Testing coupons table...');
    // We try to bypass RLS here just to see if the table exists and if we can query it
    const count = await prisma.coupon.count();
    console.log('Coupon count:', count);
    
    // Test a specific tenant
    const tenantId = '7f8841da-7e1e-4f7f-8c3e-3243a75a745c'; // Example from previous sessions if known, or just any UUID
    console.log('Testing withTenant (simulated)...');
    
    // We need to use raw SQL to set the variable since we don't have the full withTenant logic here
    await prisma.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(`SET LOCAL app.current_tenant_id = '${tenantId}'`);
      const coupons = await tx.coupon.findMany();
      console.log('Coupons for tenant:', coupons.length);
    });
    
  } catch (err) {
    console.error('ERROR:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
