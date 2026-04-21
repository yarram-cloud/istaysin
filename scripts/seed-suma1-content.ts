#!/usr/bin/env node
/**
 * seed-suma1-content.ts
 *
 * Seeds the Website Builder with rich sample content for the "suma1"
 * tenant so that all 16 components and all themes can be tested.
 *
 * Usage:
 *   npx ts-node --project tsconfig.json scripts/seed-suma1-content.ts
 *   (or run with tsx: npx tsx scripts/seed-suma1-content.ts)
 *
 * Env vars:
 *   API_URL         — defaults to http://localhost:4100
 *   ADMIN_EMAIL     — defaults to admin@demo.com
 *   ADMIN_PASSWORD  — defaults to password123
 */

const API_URL  = process.env.API_URL        ?? 'http://localhost:4100';
// Credentials can also be passed as CLI args: `npx tsx seed-suma1-content.ts email password`
const EMAIL    = process.argv[2] || process.env.ADMIN_EMAIL    || 'admin@istaysin.com';
const PASSWORD = process.argv[3] || process.env.ADMIN_PASSWORD || 'Password123!';

// ─────────────────────────────────────────────────────────────────────────────
// Sample content payload — covers all 16 CMS components
// ─────────────────────────────────────────────────────────────────────────────
const SAMPLE_CONTENT = {
  en: {
    promoBanner: {
      enabled: true,
      text: '🎉 Limited Offer: Book 3 nights, get the 4th FREE! Use code STAY4GET1',
      ctaLabel: 'Book Now',
      ctaUrl: '/book',
      bgColor: '#1d4ed8',
    },
    hero: {
      headline: 'Welcome to Suma Residency',
      subheadline: 'Your luxurious retreat in the heart of the city — where comfort meets elegance.',
      ctaLabel: 'Check Availability',
      ctaUrl: '/book',
      backgroundImageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1600',
      overlayOpacity: 0.45,
    },
    aboutUs: {
      title: 'About Suma Residency',
      body: 'Established in 2010, Suma Residency has been welcoming guests from across India and the world. Nestled in the heart of Hyderabad, we offer world-class hospitality with a personal touch. Our 48 elegantly appointed rooms, award-winning cuisine, and dedicated staff ensure that every stay is truly memorable.',
      imageUrl: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800',
      ctaLabel: 'Our Story',
      ctaUrl: '/about',
    },
    statsBar: {
      stats: [
        { label: 'Happy Guests', value: '12,000+', icon: '😊' },
        { label: 'Rooms', value: '48', icon: '🛏️' },
        { label: 'Years of Excellence', value: '14', icon: '⭐' },
        { label: 'Cuisines Served', value: '200+', icon: '🍽️' },
      ],
    },
    featuredRooms: {
      sectionTitle: 'Our Room Categories',
      sectionSubtitle: 'From cosy standard rooms to opulent suites — find the perfect room for your stay.',
      rooms: [
        {
          id: 'sample-1',
          name: 'Deluxe Room',
          description: 'Spacious 280 sq ft room with king-sized bed, city view, flat-screen TV, and complimentary Wi-Fi.',
          pricePerNight: 2800,
          imageUrl: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800',
          amenities: ['King Bed', 'City View', 'Free Wi-Fi', 'AC', 'Hot Shower'],
        },
        {
          id: 'sample-2',
          name: 'Premium Suite',
          description: 'A 480 sq ft suite with separate living area, espresso machine, walk-in wardrobe, and panoramic views.',
          pricePerNight: 5500,
          imageUrl: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800',
          amenities: ['King Bed', 'Living Room', 'Espresso Machine', 'Bathtub', 'Panoramic View'],
        },
        {
          id: 'sample-3',
          name: 'Executive Twin',
          description: 'Perfect for business travellers — two queen beds, work desk, high-speed internet, and daily newspaper.',
          pricePerNight: 3200,
          imageUrl: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800',
          amenities: ['Twin Beds', 'Work Desk', 'High-Speed Wi-Fi', 'AC', 'Safe'],
        },
      ],
    },
    amenities: {
      sectionTitle: 'Hotel Amenities',
      sectionSubtitle: 'Everything you need for a perfect stay, all under one roof.',
      items: [
        { icon: '🍽️', label: 'Multi-Cuisine Restaurant' },
        { icon: '🏊', label: 'Swimming Pool' },
        { icon: '💆', label: 'Spa & Wellness' },
        { icon: '🏋️', label: 'Fitness Centre' },
        { icon: '🅿️', label: 'Valet Parking' },
        { icon: '📶', label: 'High-Speed Wi-Fi' },
        { icon: '✈️', label: 'Airport Transfers' },
        { icon: '🍸', label: 'Rooftop Bar' },
        { icon: '📋', label: '24×7 Room Service' },
        { icon: '🧺', label: 'Laundry Service' },
        { icon: '🚌', label: 'City Tour Desk' },
        { icon: '♿', label: 'Wheelchair Accessible' },
      ],
    },
    photoGallery: {
      sectionTitle: 'Gallery',
      images: [
        { url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800', caption: 'Hotel Exterior' },
        { url: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800', caption: 'Deluxe Room' },
        { url: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800', caption: 'Premium Suite' },
        { url: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800', caption: 'Swimming Pool' },
        { url: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800', caption: 'Restaurant' },
        { url: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800', caption: 'Spa & Wellness' },
      ],
    },
    nearbyAttractions: {
      sectionTitle: 'Nearby Attractions',
      sectionSubtitle: 'Explore the best of Hyderabad, just minutes from our doors.',
      attractions: [
        { name: 'Charminar', distance: '2.5 km', icon: '🕌', description: 'The iconic 16th-century landmark of Hyderabad.' },
        { name: 'Golconda Fort', distance: '11 km', icon: '🏰', description: 'A magnificent medieval fortress with panoramic views.' },
        { name: 'Hussain Sagar Lake', distance: '4 km', icon: '🏞️', description: 'A scenic heart-shaped lake in the city centre.' },
        { name: 'Ramoji Film City', distance: '35 km', icon: '🎬', description: 'The world\'s largest film studio complex.' },
        { name: 'Birla Mandir', distance: '3 km', icon: '⛩️', description: 'A stunning white marble temple atop Kala Pahad.' },
        { name: 'Hyderabad International Airport', distance: '32 km', icon: '✈️', description: 'RGIA — served by all major airlines.' },
      ],
    },
    locationMap: {
      sectionTitle: 'Find Us',
      address: '42, MG Road, Banjara Hills, Hyderabad – 500034, Telangana',
      googleMapsEmbedUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3806.9!2d78.4421!3d17.4126!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTfCsDI0JzQ1LjQiTiA3OMKwMjYnMzEuNiJF!5e0!3m2!1sen!2sin!4v1620000000000!5m2!1sen!2sin',
      phone: '+91 40 4567 8900',
      email: 'reservations@sumaresidency.com',
    },
    testimonials: {
      sectionTitle: 'What Our Guests Say',
      items: [
        {
          name: 'Priya Reddy',
          location: 'Hyderabad',
          rating: 5,
          text: 'Absolutely wonderful experience! The staff went above and beyond to make our anniversary special. Will definitely return.',
          avatar: 'https://i.pravatar.cc/80?img=1',
        },
        {
          name: 'Arjun Mehta',
          location: 'Mumbai',
          rating: 5,
          text: 'Best hotel stay in Hyderabad! Clean rooms, delicious food, and incredibly helpful staff. The rooftop bar view is stunning.',
          avatar: 'https://i.pravatar.cc/80?img=12',
        },
        {
          name: 'Sarah Johnson',
          location: 'Singapore',
          rating: 4,
          text: 'Great location, comfortable beds, and excellent service. The Biryani at the restaurant was the best I\'ve ever had!',
          avatar: 'https://i.pravatar.cc/80?img=5',
        },
        {
          name: 'Ravi Kumar',
          location: 'Bangalore',
          rating: 5,
          text: 'Perfect for a business stay. Fast Wi-Fi, quiet rooms, and an excellent breakfast spread every morning.',
          avatar: 'https://i.pravatar.cc/80?img=8',
        },
      ],
    },
    callToAction: {
      title: 'Ready to Experience Suma Residency?',
      subtitle: 'Book directly with us for the best rates and exclusive benefits.',
      ctaLabel: 'Book Your Stay',
      ctaUrl: '/book',
      secondaryLabel: 'Call Us Now',
      secondaryUrl: 'tel:+914045678900',
    },
    faq: {
      sectionTitle: 'Frequently Asked Questions',
      items: [
        { question: 'What are your check-in and check-out times?', answer: 'Check-in is from 2:00 PM and check-out is by 11:00 AM. Early check-in and late check-out are available subject to availability.' },
        { question: 'Is breakfast included in the room rate?', answer: 'Our Deluxe and Suite categories include complimentary breakfast. Standard rooms can add breakfast for ₹350 per person.' },
        { question: 'Do you offer airport transfers?', answer: 'Yes! We offer airport pick-up and drop services from RGIA. Please book at least 24 hours in advance. Charges apply based on vehicle type.' },
        { question: 'Is there free parking available?', answer: 'Yes, we offer complimentary valet parking for all hotel guests.' },
        { question: 'What is your cancellation policy?', answer: 'Free cancellation up to 48 hours before check-in. Cancellations within 48 hours are charged one night\'s stay.' },
        { question: 'Do you accept pets?', answer: 'We are a pet-friendly property. Pets under 10 kg are welcome. Please inform us in advance.' },
      ],
    },
    policies: {
      sectionTitle: 'Hotel Policies',
      policies: [
        { title: 'Check-In Policy', body: 'Valid Government ID mandatory. Minimum age 18 years for check-in. Foreign nationals must present passport.' },
        { title: 'Payment', body: 'We accept all major credit/debit cards, UPI, net banking, and cash. Advance payment required for peak season bookings.' },
        { title: 'Smoking Policy', body: 'Suma Residency is a non-smoking property. Designated smoking zones are available on Ground Floor and Terrace.' },
        { title: 'Extra Bed Policy', body: 'Extra beds available at ₹800 per night per bed. Maximum one extra bed per room.' },
      ],
    },
    awards: {
      sectionTitle: 'Awards & Recognition',
      items: [
        { title: 'TripAdvisor Certificate of Excellence 2024', year: '2024', imageUrl: '' },
        { title: 'Booking.com Guest Review Award — 9.2 Rating', year: '2023', imageUrl: '' },
        { title: 'Best Business Hotel — Times Travel Awards', year: '2022', imageUrl: '' },
        { title: 'Green Hotel Certification — CII', year: '2021', imageUrl: '' },
      ],
    },
    footer: {
      tagline: 'Suma Residency — Where Every Stay Tells a Story',
      address: '42, MG Road, Banjara Hills, Hyderabad – 500034',
      phone: '+91 40 4567 8900',
      email: 'reservations@sumaresidency.com',
      socialLinks: {
        instagram: 'https://instagram.com/sumaresidency',
        facebook: 'https://facebook.com/sumaresidency',
        twitter: 'https://twitter.com/sumaresidency',
        youtube: '',
        whatsapp: 'https://wa.me/914045678900',
      },
      legalLinks: [
        { label: 'Privacy Policy', url: '/privacy' },
        { label: 'Terms & Conditions', url: '/terms' },
        { label: 'Cookie Policy', url: '/cookies' },
      ],
    },
  },
};

// ─────────────────────────────────────────────────────────────────────────────
const WEBSITE_BUILDER_CONFIG = {
  activeTheme: 'luxury-gold',           // Test with: corporate-clean, ocean-breeze, royal-heritage etc.
  componentsEnabled: {
    promoBanner: true,
    hero: true,
    aboutUs: true,
    statsBar: true,
    featuredRooms: true,
    amenities: true,
    photoGallery: true,
    nearbyAttractions: true,
    locationMap: true,
    testimonials: true,
    callToAction: true,
    faq: true,
    policies: true,
    awards: true,
    footer: true,
  },
  componentOrder: [
    'promoBanner', 'hero', 'aboutUs', 'statsBar', 'featuredRooms',
    'amenities', 'photoGallery', 'nearbyAttractions', 'locationMap',
    'testimonials', 'callToAction', 'faq', 'policies', 'awards', 'footer',
  ],
  branding: {
    primaryColor: '#c8963e',
    secondaryColor: '#1a3a5c',
    accentColor: '#d4a853',
    surfaceColor: '#fdf8f0',
    fontPrimary: 'Cormorant Garamond',
    fontSecondary: 'Montserrat',
  },
  content: SAMPLE_CONTENT,
};

// ─────────────────────────────────────────────────────────────────────────────
async function main() {
  console.log('🔐 Logging in as', EMAIL, '...');
  const loginRes = await fetch(`${API_URL}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });

  if (!loginRes.ok) {
    console.error('❌ Login failed:', await loginRes.text());
    process.exit(1);
  }

  const loginData = await loginRes.json();
  const token    = loginData.data?.accessToken as string;
  // tenantId lives inside memberships array, not at the top of `data`
  const tenantId = (loginData.data?.tenantId
    || loginData.data?.memberships?.[0]?.tenantId) as string;

  if (!token || !tenantId) {
    console.error('❌ No token or tenantId in login response:', JSON.stringify(loginData, null, 2));
    process.exit(1);
  }

  console.log('✅ Logged in. Tenant ID:', tenantId);

  // ── Fetch current settings ──────────────────────────────────────────────
  console.log('📥 Fetching current tenant settings...');
  const getRes = await fetch(`${API_URL}/api/v1/tenants/${tenantId}/settings`, {
    headers: { Authorization: `Bearer ${token}`, 'x-tenant-id': tenantId },
  });

  const currentSettings = getRes.ok ? ((await getRes.json()).data?.config ?? {}) : {};

  // ── Deep merge & save ───────────────────────────────────────────────────
  const updatedConfig = {
    ...currentSettings,
    websiteBuilder: WEBSITE_BUILDER_CONFIG,
  };

  console.log('💾 Saving website builder sample content...');
  const saveRes = await fetch(`${API_URL}/api/v1/tenants/${tenantId}/settings`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      'x-tenant-id': tenantId,
    },
    body: JSON.stringify({ config: updatedConfig }),
  });

  if (!saveRes.ok) {
    console.error('❌ Save failed:', await saveRes.text());
    process.exit(1);
  }

  const saved = await saveRes.json();
  console.log('✅ Sample content saved successfully!');
  console.log('');
  console.log('🎨 Active Theme:        luxury-gold (change in CMS to test others)');
  console.log('📦 Components enabled:  All 15 sections');
  console.log('🌐 Languages seeded:    English (en) — switch in CMS to test others');
  console.log('');
  console.log('📍 Next steps:');
  console.log('   1. Open http://localhost:3000/dashboard/website');
  console.log('   2. Click each tab to verify sample content is pre-filled');
  console.log('   3. Change the "Appearance" theme to test each of the 12 themes');
  console.log('   4. Switch locale to "Hindi" and click "Magic Translate"');
  console.log('   5. Open the public IBE at http://localhost:3000/[your-slug] to see live rendering');
  console.log('');
  console.log('Saved response ID:', (saved as any).data?.id ?? '(check DB)');
}

main().catch(err => {
  console.error('❌ Unexpected error:', err);
  process.exit(1);
});
