import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verify() {
  console.log('🔍 Verifying Walk-in Bookings...');
  
  const bookings = await prisma.booking.findMany({
    where: { source: 'walkin' },
    orderBy: { createdAt: 'desc' },
    take: 5,
    include: {
      folioCharges: true,
      guestPayments: true
    }
  });

  if (bookings.length === 0) {
    console.log('❌ No walk-in bookings found.');
    return;
  }

  bookings.forEach((b, i) => {
    console.log(`\n--- Booking #${i + 1} ---`);
    console.log(`ID: ${b.id}`);
    console.log(`Guest: ${b.guestName} (${b.guestPhone})`);
    console.log(`Status: ${b.status}`);
    console.log(`Check-in: ${b.checkInDate}`);
    console.log(`Folio Charges: ${b.folioCharges.length}`);
    b.folioCharges.forEach(c => {
      console.log(`  - [${c.chargeDate.toISOString().split('T')[0]}] ${c.description}: ₹${c.totalPrice}`);
    });
    console.log(`Payments: ${b.guestPayments.length}`);
  });
}

verify()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
