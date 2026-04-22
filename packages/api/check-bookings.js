const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const bookings = await prisma.booking.findMany({
        where: {
            tenant: { slug: 'suma1' }
        },
        orderBy: { createdAt: 'desc' }
    });
    
    console.log(`Found ${bookings.length} bookings for suma1`);
    bookings.forEach(b => {
        let paymentMode = 'unknown';
        try {
            const notes = JSON.parse(b.notes || '{}');
            paymentMode = notes.paymentMode || 'not_set';
        } catch (e) {}
        console.log(`- ${b.bookingNumber}: Status=${b.status}, PaymentMode=${paymentMode}`);
    });
}

main().catch(console.error).finally(() => prisma.$disconnect());
