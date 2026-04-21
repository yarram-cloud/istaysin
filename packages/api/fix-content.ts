import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const tenant = await prisma.tenant.findUnique({ where: { slug: 'suma1' } });
  if (!tenant || !tenant.config) return console.error('Tenant or config not found');
  
  const config = tenant.config as any;
  const oldEn = config.websiteBuilder?.content?.en || {};
  
  const newEn = {
    promotionalBanner: {
      text: '🎉 Limited Offer: Book 3 nights, get the 4th FREE! Use code STAY4GET1',
      linkLabel: 'Book Now',
      link: '/book',
      backgroundColor: '#1d4ed8',
      dismissible: true
    },
    hero: {
      title: 'Welcome to Suma Residency',
      subtitle: 'Your luxurious retreat in the heart of the city — where comfort meets elegance.',
      ctaLabel: 'Check Availability',
      ctaUrl: '/book',
      images: ['https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1600'],
      overlayOpacity: 45,
      ctaStyle: 'filled'
    },
    aboutUs: {
      title: 'About Suma Residency',
      description: 'Established in 2010, Suma Residency has been welcoming guests from across India and the world. Nestled in the heart of Hyderabad, we offer world-class hospitality with a personal touch. Our 48 elegantly appointed rooms, award-winning cuisine, and dedicated staff ensure that every stay is truly memorable.',
      highlights: [],
      image: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800',
      layout: 'image-right'
    },
    stats: {
      title: '',
      items: [
        { label: 'Happy Guests', value: '12,000+', icon: '😊' },
        { label: 'Rooms', value: '48', icon: '🛏️' },
        { label: 'Years of Excellence', value: '14', icon: '⭐' },
        { label: 'Cuisines Served', value: '200+', icon: '🍽️' },
      ],
    },
    featuredRooms: [
      {
        linkedRoomTypeId: 'sample-1',
        marketingTitleOverride: 'Deluxe Room',
        marketingPriceOverride: '2800',
        featuresOverride: ['King Bed', 'City View', 'Free Wi-Fi', 'AC', 'Hot Shower'],
        imageOverride: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800'
      },
      {
        linkedRoomTypeId: 'sample-2',
        marketingTitleOverride: 'Premium Suite',
        marketingPriceOverride: '5500',
        featuresOverride: ['King Bed', 'Living Room', 'Espresso Machine', 'Bathtub'],
        imageOverride: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800'
      },
      {
        linkedRoomTypeId: 'sample-3',
        marketingTitleOverride: 'Executive Twin',
        marketingPriceOverride: '3200',
        featuresOverride: ['Twin Beds', 'Work Desk', 'High-Speed Wi-Fi', 'AC'],
        imageOverride: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800'
      }
    ],
    amenities: {
      title: 'Hotel Amenities',
      subtitle: 'Everything you need for a perfect stay, all under one roof.',
      layout: 'grid',
      items: [
        { icon: '🍽️', name: 'Multi-Cuisine Restaurant', description: '' },
        { icon: '🏊', name: 'Swimming Pool', description: '' },
        { icon: '💆', name: 'Spa & Wellness', description: '' },
        { icon: '🏋️', name: 'Fitness Centre', description: '' },
        { icon: '🅿️', name: 'Valet Parking', description: '' },
        { icon: '📶', name: 'High-Speed Wi-Fi', description: '' },
        { icon: '✈️', name: 'Airport Transfers', description: '' },
        { icon: '🍸', name: 'Rooftop Bar', description: '' },
        { icon: '📋', name: '24×7 Room Service', description: '' },
        { icon: '🧺', name: 'Laundry Service', description: '' },
        { icon: '🚌', name: 'City Tour Desk', description: '' },
        { icon: '♿', name: 'Wheelchair Accessible', description: '' },
      ],
    },
    photoGallery: {
      title: 'Gallery',
      layout: 'masonry',
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
      title: 'Nearby Attractions',
      subtitle: 'Explore the best of Hyderabad, just minutes from our doors.',
      items: [
        { name: 'Charminar', distance: '2.5 km', icon: '🕌' },
        { name: 'Golconda Fort', distance: '11 km', icon: '🏰' },
        { name: 'Hussain Sagar Lake', distance: '4 km', icon: '🏞️' },
        { name: 'Ramoji Film City', distance: '35 km', icon: '🎬' },
        { name: 'Birla Mandir', distance: '3 km', icon: '⛩️' },
        { name: 'Hyderabad International Airport', distance: '32 km', icon: '✈️' },
      ],
    },
    locationMap: {
      title: 'Find Us',
      address: '42, MG Road, Banjara Hills, Hyderabad – 500034, Telangana',
      googleMapsEmbedUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3806.9!2d78.4421!3d17.4126!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTfCsDI0JzQ1LjQiTiA3OMKwMjYnMzEuNiJF!5e0!3m2!1sen!2sin!4v1620000000000!5m2!1sen!2sin',
    },
    testimonials: {
      title: 'What Our Guests Say',
      showRating: true,
      layout: 'cards',
      items: [
        {
          guestName: 'Priya Reddy',
          location: 'Hyderabad',
          rating: 5,
          reviewText: 'Absolutely wonderful experience! The staff went above and beyond to make our anniversary special. Will definitely return.',
          avatarUrl: 'https://i.pravatar.cc/80?img=1',
        },
        {
          guestName: 'Arjun Mehta',
          location: 'Mumbai',
          rating: 5,
          reviewText: 'Best hotel stay in Hyderabad! Clean rooms, delicious food, and incredibly helpful staff. The rooftop bar view is stunning.',
          avatarUrl: 'https://i.pravatar.cc/80?img=12',
        },
        {
          guestName: 'Sarah Johnson',
          location: 'Singapore',
          rating: 4,
          reviewText: 'Great location, comfortable beds, and excellent service. The Biryani at the restaurant was the best I\'ve ever had!',
          avatarUrl: 'https://i.pravatar.cc/80?img=5',
        },
        {
          guestName: 'Ravi Kumar',
          location: 'Bangalore',
          rating: 5,
          reviewText: 'Perfect for a business stay. Fast Wi-Fi, quiet rooms, and an excellent breakfast spread every morning.',
          avatarUrl: 'https://i.pravatar.cc/80?img=8',
        },
      ],
    },
    callToAction: {
      title: 'Ready to Experience Suma Residency?',
      subtitle: 'Book directly with us for the best rates and exclusive benefits.',
      ctaLabel: 'Book Your Stay',
      ctaLink: '/book',
      secondaryCta: { label: 'Call Us Now', link: 'tel:+914045678900' },
      style: 'centered',
      backgroundType: 'solid',
      backgroundValue: '#0ea5e9'
    },
    faq: {
      title: 'Frequently Asked Questions',
      items: [
        { q: 'What are your check-in and check-out times?', a: 'Check-in is from 2:00 PM and check-out is by 11:00 AM. Early check-in and late check-out are available subject to availability.' },
        { q: 'Is parking available?', a: 'Yes, we offer complimentary secure valet parking for all our guests.' },
        { q: 'Do you have airport transfer services?', a: 'We provide 24x7 airport pick-up and drop services. Please contact the front desk 24 hours prior to your flight.' },
        { q: 'Are pets allowed?', a: 'While we love animals, strictly no pets are allowed on the property to ensure comfort for all guests.' },
      ],
    },
    policies: {
      title: 'House Rules & Policies',
      checkInTime: '14:00',
      checkOutTime: '11:00',
      cancellationPolicy: 'Valid Government ID mandatory. Minimum age 18 years for check-in. Foreign nationals must present passport. We accept all major credit/debit cards, UPI, net banking, and cash. Advance payment required for peak season bookings. Suma Residency is a non-smoking property. Designated smoking zones are available on Ground Floor and Terrace. Extra beds available at ₹800 per night per bed. Maximum one extra bed per room.'
    },
    awards: {
      items: [
        { year: '2024', title: 'TripAdvisor Certificate of Excellence 2024' },
        { year: '2023', title: 'Booking.com Guest Review Award - 9.2 Rating' },
      ]
    },
    contactFooter: {
      addressHtml: '42, MG Road, Banjara Hills, Hyderabad - 500034',
      googleMapsEmbedUrl: '',
      socialLinks: { twitter: "https://twitter.com/sumaresidency", facebook: "https://facebook.com/sumaresidency", instagram: "https://instagram.com/sumaresidency", whatsapp: "https://wa.me/914045678900" },
      copyrightText: '© 2026 Suma Residency. All rights reserved.',
      checkInRules: ''
    }
  };

  config.websiteBuilder.content.en = newEn;
  
  await prisma.tenant.update({
    where: { id: tenant.id },
    data: { config }
  });
  
  console.log("✅ Database successfully patched with correct CMS keys.");
}

main().catch(console.error).finally(() => prisma.$disconnect());
