import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding "suma1" dummy website content...\n');

  // Find or create global user for suma1
  let user = await prisma.globalUser.findUnique({
    where: { email: 'owner@suma1.com' }
  });

  if (!user) {
    user = await prisma.globalUser.create({
      data: {
        email: 'owner@suma1.com',
        fullName: 'Suma Properties',
        passwordHash: '$2a$12$zP.NByF.tC0I4mJ9oZxw5ub4c34aWq8k0O.T/A/8kI.qL14k7YqOq', // hash for 12345678
      }
    });
  }

  // Find or create tenant suma1
  let tenant = await prisma.tenant.findUnique({
    where: { slug: 'suma1' }
  });

  if (!tenant) {
    tenant = await prisma.tenant.create({
      data: {
        slug: 'suma1',
        name: 'Suma Grand Resort',
        ownerId: user.id
      }
    });
  }

  // Seed massive config payload
  const fullConfig = {
    websiteBuilder: {
      theme: 'playful-vibrant',
      fontHeading: 'playfair',
      fontBody: 'inter',
      borderRadius: 'rounded-2xl',
      darkMode: 'light',
      components: {
        header: { enabled: true, style: 'default' },
        hero: { 
          enabled: true, 
          headline: 'Escape to Paradise', 
          subheadline: 'Luxury stays with panoramic views.', 
          buttonText: 'Book Your Stay' 
        },
        about: { 
          enabled: true, 
          title: 'Welcome to Suma Grand', 
          contentHtml: '<p>Nestled in the heart of nature, Suma Grand blends luxury with eco-friendly elegance. Our resort spans 50 acres of pristine woodlands.</p>', 
          image: 'https://images.unsplash.com/photo-1542314831-c6a4d14faaf2?q=80&w=1000&auto=format&fit=crop' 
        },
        stats: { 
          enabled: true, 
          stats: [
            { label: 'Happy Guests', value: '10K+' },
            { label: 'Luxury Suites', value: '45' },
            { label: 'Michelin Star Dining', value: '3' },
            { label: 'Private Beaches', value: '2' }
          ] 
        },
        amenities: { 
          enabled: true, 
          title: 'Premium Amenities', 
          list: [
            { label: 'Infinity Pool', icon: 'Waves' },
            { label: 'Himalayan Rock Spa', icon: 'Bath' },
            { label: 'Fast 5G WiFi', icon: 'Wifi' },
            { label: 'Private Helipad', icon: 'Star' },
            { label: 'Vintage Wine Cellar', icon: 'GlassWater' },
            { label: 'Fitness Center', icon: 'Dumbbell' },
            { label: 'Restaurant', icon: 'UtensilsCrossed' },
            { label: 'Mountain View', icon: 'Mountain' },
            { label: 'Valet Parking', icon: 'ParkingCircle' },
            { label: '24/7 Security', icon: 'ShieldCheck' },
            { label: 'Laundry Service', icon: 'Shirt' },
            { label: 'Room Service', icon: 'Phone' }
          ]
        },
        rooms: { enabled: true, title: 'Signature Accommodations', subtitle: 'Rest in pure comfort', limit: 6, selectionMode: 'auto' },
        gallery: { 
          enabled: true, 
          title: 'Property Showcase', 
          images: [
            'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?q=80&w=1000&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1582719478250-c89404bb8a0e?q=80&w=1000&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?q=80&w=1000&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1618773928121-c32242e63f39?q=80&w=1000&auto=format&fit=crop'
          ] 
        },
        nearby: { 
          enabled: true, 
          title: 'What\'s Nearby', 
          places: [
            { name: 'Crystal Lake', distance: '1.2 km' },
            { name: 'National Park Trail', distance: '3.5 km' },
            { name: 'Downtown Market', distance: '10 mins drive' }
          ] 
        },
        reviews: { 
          enabled: true, 
          title: 'Guest Experiences', 
          items: [
            { author: 'Priya Sharma', rating: 5, text: 'Absolutely breathtaking! The infinity pool overlooking the valley was surreal. Staff went above and beyond.' },
            { author: 'Rajesh Mehta', rating: 4, text: 'Clean rooms, fantastic location. The spa was a highlight. Only wish the checkout was a bit later.' },
            { author: 'Ananya Iyer', rating: 5, text: 'Perfect family getaway. Kids loved the garden trails, and the restaurant had amazing South Indian food.' },
            { author: 'David Chen', rating: 5, text: 'We celebrated our anniversary here. The private dining by the lake was magical. Highly recommend!' },
            { author: 'Meera Joshi', rating: 4, text: 'Beautiful property with eco-friendly practices. The organic breakfast was delicious every morning.' }
          ]
        },
        faq: { 
          enabled: true, 
          title: 'Common Questions', 
          questions: [
            { q: 'Is breakfast included?', a: 'Yes, a complimentary organic breakfast buffet is served daily.' },
            { q: 'What is the cancellation policy?', a: 'Free cancellation up to 48 hours before check-in.' },
            { q: 'Do you offer airport transfer?', a: 'Yes, we provide complimentary airport pickup and drop. Please notify us 24 hours in advance.' }
          ] 
        },
        policies: { 
          enabled: true, 
          title: 'Property Rules', 
          rules: [
            { title: 'Check-in Time', description: '3:00 PM onwards' },
            { title: 'Check-out Time', description: '11:00 AM' },
            { title: 'Pets', description: 'No pets allowed on the property' },
            { title: 'Quiet Hours', description: '10:00 PM to 7:00 AM' },
            { title: 'Smoking', description: 'Smoking only in designated outdoor areas' },
            { title: 'ID Proof', description: 'Valid government ID required at check-in' },
            { title: 'Extra Bed', description: 'Available on request at ₹1,500 per night' }
          ]
        },
        footer: { 
          enabled: true, 
          text: '© 2026 Suma Grand Resort.', 
          socialLinks: { facebook: 'https://fb.com', instagram: 'https://instagram.com', twitter: 'https://x.com' } 
        },
        contact: {
          email: 'hello@sumagrand.com',
          phone: '+91 98765 43210',
          address: '123 Cloud Forest Road, Kerala'
        },
        seo: { title: 'Suma Grand | Luxury Resort', description: 'Book your perfect escape today.', keywords: 'resort, kerala, luxury' },
      }
    }
  };

  await prisma.tenant.update({
    where: { id: tenant.id },
    data: {
      brandLogo: 'https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=200&auto=format&fit=crop',
      primaryColor: '#0ea5e9',
      secondaryColor: '#38bdf8',
      tagline: 'Escape to Paradise',
      heroImage: 'https://images.unsplash.com/photo-1542314831-c6a4d14faaf2?q=80&w=1000&auto=format&fit=crop',
      description: 'Luxury resort located in the heart of nature.',
      config: fullConfig
    }
  });

  console.log('✅ Suma1 seeded completely!');
}

main().finally(() => prisma.$disconnect());
