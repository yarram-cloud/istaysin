const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const duplicates = await prisma.globalUser.findMany({
    where: { phone: '+919123456789' }
  });
  
  for (let i = 0; i < duplicates.length; i++) {
    const newPhone = '+91912345678' + i;
    await prisma.globalUser.update({
      where: { id: duplicates[i].id },
      data: { phone: newPhone }
    });
    console.log(`Updated user ${duplicates[i].email} to phone ${newPhone}`);
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());
