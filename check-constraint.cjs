const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const rows = await prisma.$queryRaw`
    SELECT column_name, is_nullable, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'guest_profiles' AND column_name = 'global_user_id'
  `;
  console.log('Column info:', JSON.stringify(rows, null, 2));

  try {
    const g = await prisma.guestProfile.create({
      data: { fullName: 'Test Constraint Check', email: 'constraint-test-xyz@test.com', phone: '0000000001' }
    });
    console.log('Created OK:', g.id);
    await prisma.guestProfile.delete({ where: { id: g.id } });
    console.log('Deleted OK');
  } catch (e) {
    console.error('Creation Error:', e.message.split('\n').slice(0, 3).join(' | '));
  }

  await prisma.$disconnect();
}
main();
