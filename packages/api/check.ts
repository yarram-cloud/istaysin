import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function check() {
  const t = await prisma.tenant.findUnique({
    where: { slug: 'suma1' },
    select: { config: true }
  });
  console.log(JSON.stringify(t?.config || {}, null, 2));
  await prisma.$disconnect();
}
check().catch(console.error);
