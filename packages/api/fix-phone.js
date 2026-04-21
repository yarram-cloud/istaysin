const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  await prisma.$executeRaw`UPDATE global_users SET phone = NULL WHERE phone = ''`;
  await prisma.$executeRaw`UPDATE guest_profiles SET phone = NULL WHERE phone = ''`; // Safety check too!
  console.log("Empty phones updated to NULL successfully");
}
main().catch(console.error).finally(() => prisma.$disconnect());
