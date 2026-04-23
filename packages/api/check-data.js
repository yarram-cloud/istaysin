const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const tenants = await prisma.tenant.findMany({ select: { id: true, name: true, slug: true } });
  for (const t of tenants) {
    const rooms = await prisma.room.count({ where: { tenantId: t.id } });
    const activeRooms = await prisma.room.count({ where: { tenantId: t.id, isActive: true } });
    const floors = await prisma.floor.count({ where: { tenantId: t.id } });
    const types = await prisma.roomType.count({ where: { tenantId: t.id } });
    const bookings = await prisma.booking.count({ where: { tenantId: t.id } });
    const guests = await prisma.bookingGuest.count({ where: { tenantId: t.id } });
    console.log(JSON.stringify({ tenant: t.name, slug: t.slug, rooms, activeRooms, floors, types, bookings, guests }));
  }
  await prisma.$disconnect();
}
main();
