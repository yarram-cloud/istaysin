const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const users = await prisma.globalUser.groupBy({
    by: ['phone'],
    _count: {
      phone: true
    },
    having: {
      phone: {
        _count: {
          gt: 1,
        },
      },
    },
  });
  console.log("Duplicate Phones", users);
}
main().catch(console.error).finally(() => prisma.$disconnect());
