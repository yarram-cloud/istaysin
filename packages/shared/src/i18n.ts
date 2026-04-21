// iStays i18n — Lightweight translation system for guest-facing property websites
// Translations are stored in Tenant.config.translations JSON field

export const SUPPORTED_LOCALES = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી' },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية' },
  { code: 'fr', name: 'French', nativeName: 'Français' },
  { code: 'de', name: 'German', nativeName: 'Deutsch' },
] as const;

export type LocaleCode = (typeof SUPPORTED_LOCALES)[number]['code'];

// Default English translations — serves as the master key reference
export const DEFAULT_TRANSLATIONS: Record<string, string> = {
  // Navigation
  'nav.home': 'Home',
  'nav.rooms': 'Rooms',
  'nav.about': 'About',
  'nav.reviews': 'Reviews',
  'nav.contact': 'Contact',
  'nav.book_now': 'Book Now',

  // Hero Section
  'hero.welcome': 'Welcome to',
  'hero.check_availability': 'Check Availability',

  // Rooms Section
  'rooms.heading': 'Our Rooms & Suites',
  'rooms.subheading': 'Find the perfect room for your stay',
  'rooms.per_night': 'per night',
  'rooms.book_this_room': 'Book This Room',
  'rooms.guests': 'Guests',
  'rooms.amenities': 'Amenities',
  'rooms.extra_bed': 'Extra Bed Available',

  // About Section
  'about.heading': 'About Our Property',

  // Reviews Section
  'reviews.heading': 'Guest Reviews',
  'reviews.subheading': 'What our guests say about us',
  'reviews.no_reviews': 'No reviews yet. Be the first to share your experience!',

  // Booking Form
  'booking.heading': 'Book Your Stay',
  'booking.check_in': 'Check-in Date',
  'booking.check_out': 'Check-out Date',
  'booking.adults': 'Adults',
  'booking.children': 'Children',
  'booking.select_rooms': 'Select Rooms',
  'booking.guest_details': 'Guest Details',
  'booking.full_name': 'Full Name',
  'booking.email': 'Email Address',
  'booking.phone': 'Phone Number',
  'booking.special_requests': 'Special Requests',
  'booking.summary': 'Booking Summary',
  'booking.total': 'Total Amount',
  'booking.taxes': 'Taxes & Fees',
  'booking.grand_total': 'Grand Total',
  'booking.confirm': 'Confirm Booking',
  'booking.nights': 'nights',
  'booking.room': 'room',
  'booking.rooms': 'rooms',

  // Footer
  'footer.rights': 'All rights reserved',
  'footer.powered_by': 'Powered by iStays',
  'footer.address': 'Address',
  'footer.phone': 'Phone',
  'footer.email': 'Email',

  // General
  'general.loading': 'Loading...',
  'general.error': 'Something went wrong',
  'general.back': 'Back',
  'general.next': 'Next',
  'general.cancel': 'Cancel',
  'general.save': 'Save',
  'general.close': 'Close',

  // Loyalty
  'loyalty.points': 'Loyalty Points',
  'loyalty.your_balance': 'Your Points Balance',
  'loyalty.earn_message': 'Earn points on every booking!',
  'loyalty.redeem': 'Redeem Points',
  'loyalty.tier': 'Your Tier',
};

/**
 * Resolves a translation key to its localized string.
 * Falls back: tenant translation → default English → key itself
 */
export function getTranslation(
  translations: Record<string, Record<string, string>> | undefined,
  locale: string,
  key: string
): string {
  // Try tenant-specific translation for the requested locale
  if (translations?.[locale]?.[key]) {
    return translations[locale][key];
  }
  // Fall back to default English
  return DEFAULT_TRANSLATIONS[key] || key;
}

/**
 * Creates a `t()` function bound to a specific locale and tenant config.
 * Usage: const t = createTranslator(config.translations, 'hi');
 *        t('hero.welcome') → 'स्वागत है'
 */
export function createTranslator(
  translations: Record<string, Record<string, string>> | undefined,
  locale: string
) {
  return (key: string, fallback?: string): string => {
    const result = getTranslation(translations, locale, key);
    return result === key && fallback ? fallback : result;
  };
}

/**
 * Resolves the active locale from various sources.
 * Priority: URL param → cookie → guest preference → tenant default → 'en'
 */
export function resolveLocale(
  urlParam?: string | null,
  cookieValue?: string | null,
  guestPreference?: string | null,
  tenantDefault?: string | null
): string {
  const validCodes = SUPPORTED_LOCALES.map(l => l.code) as readonly string[];
  const candidates = [urlParam, cookieValue, guestPreference, tenantDefault, 'en'];
  for (const c of candidates) {
    if (c && validCodes.includes(c)) return c;
  }
  return 'en';
}
