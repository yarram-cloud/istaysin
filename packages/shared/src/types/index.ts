// ============================================================
// Roles & Permissions
// ============================================================

export const ROLES = {
  GLOBAL_ADMIN: 'global_admin',
  GLOBAL_SUPPORT: 'global_support',
  PROPERTY_OWNER: 'property_owner',
  GENERAL_MANAGER: 'general_manager',
  FRONT_DESK: 'front_desk',
  FNB_MANAGER: 'fnb_manager',
  HOUSEKEEPING: 'housekeeping',
  ACCOUNTANT: 'accountant',
  GUEST: 'guest',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

// Default permissions per role
export const DEFAULT_PERMISSIONS: Record<Role, Record<string, boolean>> = {
  global_admin: {
    canManageRooms: true,
    canManageStaff: true,
    canViewFinancials: true,
    canProcessRefunds: true,
    canAccessHousekeeping: true,
    canManageSubscription: true,
    canManageBookings: true,
    canCheckInOut: true,
    canViewAnalytics: true,
    canManageBranding: true,
  },
  global_support: {
    canManageRooms: false,
    canManageStaff: false,
    canViewFinancials: true,
    canProcessRefunds: false,
    canAccessHousekeeping: false,
    canManageSubscription: false,
    canManageBookings: false,
    canCheckInOut: false,
    canViewAnalytics: true,
    canManageBranding: false,
  },
  property_owner: {
    canManageRooms: true,
    canManageStaff: true,
    canViewFinancials: true,
    canProcessRefunds: true,
    canAccessHousekeeping: true,
    canManageSubscription: true,
    canManageBookings: true,
    canCheckInOut: true,
    canViewAnalytics: true,
    canManageBranding: true,
  },
  general_manager: {
    canManageRooms: true,
    canManageStaff: true,
    canViewFinancials: true,
    canProcessRefunds: true,
    canAccessHousekeeping: true,
    canManageSubscription: false,
    canManageBookings: true,
    canCheckInOut: true,
    canViewAnalytics: true,
    canManageBranding: true,
  },
  front_desk: {
    canManageRooms: false,
    canManageStaff: false,
    canViewFinancials: false,
    canProcessRefunds: false,
    canAccessHousekeeping: false,
    canManageSubscription: false,
    canManageBookings: true,
    canCheckInOut: true,
    canViewAnalytics: false,
    canManageBranding: false,
  },
  housekeeping: {
    canManageRooms: false,
    canManageStaff: false,
    canViewFinancials: false,
    canProcessRefunds: false,
    canAccessHousekeeping: true,
    canManageSubscription: false,
    canManageBookings: false,
    canCheckInOut: false,
    canViewAnalytics: false,
    canManageBranding: false,
  },
  fnb_manager: {
    canManageRooms: false,
    canManageStaff: false,
    canViewFinancials: false,
    canProcessRefunds: false,
    canAccessHousekeeping: false,
    canManageSubscription: false,
    canManageBookings: false,
    canCheckInOut: false,
    canViewAnalytics: false,
    canManageBranding: false,
    canManagePos: true,
  },
  accountant: {
    canManageRooms: false,
    canManageStaff: false,
    canViewFinancials: true,
    canProcessRefunds: false,
    canAccessHousekeeping: false,
    canManageSubscription: false,
    canManageBookings: false,
    canCheckInOut: false,
    canViewAnalytics: true,
    canManageBranding: false,
  },
  guest: {
    canManageRooms: false,
    canManageStaff: false,
    canViewFinancials: false,
    canProcessRefunds: false,
    canAccessHousekeeping: false,
    canManageSubscription: false,
    canManageBookings: false,
    canCheckInOut: false,
    canViewAnalytics: false,
    canManageBranding: false,
  },
};

// ============================================================
// Tenant / Property Status
// ============================================================

export const TENANT_STATUS = {
  PENDING_APPROVAL: 'pending_approval',
  ACTIVE: 'active',
  SUSPENDED: 'suspended',
  ARCHIVED: 'archived',
} as const;

export type TenantStatus = (typeof TENANT_STATUS)[keyof typeof TENANT_STATUS];

// ============================================================
// Property Types
// ============================================================

export const PROPERTY_TYPES = {
  HOTEL: 'hotel',
  LODGE: 'lodge',
  RESORT: 'resort',
  HOMESTAY: 'homestay',
  GUEST_HOUSE: 'guest_house',
} as const;

export type PropertyType = (typeof PROPERTY_TYPES)[keyof typeof PROPERTY_TYPES];

// ============================================================
// Booking
// ============================================================

export const BOOKING_STATUS = {
  PENDING_CONFIRMATION: 'pending_confirmation',
  CONFIRMED: 'confirmed',
  CHECKED_IN: 'checked_in',
  CHECKED_OUT: 'checked_out',
  CANCELLED: 'cancelled',
  NO_SHOW: 'no_show',
} as const;

export type BookingStatus = (typeof BOOKING_STATUS)[keyof typeof BOOKING_STATUS];

export const BOOKING_SOURCE = {
  ONLINE: 'online',
  WALKIN: 'walkin',
  OTA: 'ota',
  PHONE: 'phone',
  EMAIL: 'email',
  WEBSITE: 'website',
  OTA_BOOKING_COM: 'ota_booking_com',
  OTA_MAKEMYTRIP: 'ota_makemytrip',
  OTA_GOIBIBO: 'ota_goibibo',
  AGENT: 'agent',
} as const;

export type BookingSource = (typeof BOOKING_SOURCE)[keyof typeof BOOKING_SOURCE];

// ============================================================
// Room
// ============================================================

export const ROOM_STATUS = {
  AVAILABLE: 'available',
  OCCUPIED: 'occupied',
  BLOCKED: 'blocked',
  MAINTENANCE: 'maintenance',
  DIRTY: 'dirty',
  CLEANING: 'cleaning',
} as const;

export type RoomStatus = (typeof ROOM_STATUS)[keyof typeof ROOM_STATUS];

// ============================================================
// Housekeeping
// ============================================================

export const HOUSEKEEPING_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  INSPECTED: 'inspected',
} as const;

export type HousekeepingStatus = (typeof HOUSEKEEPING_STATUS)[keyof typeof HOUSEKEEPING_STATUS];

// ============================================================
// Payment
// ============================================================

export const PAYMENT_METHOD = {
  CASH: 'cash',
  UPI: 'upi',
  UPI_QR: 'upi_qr',
  CARD: 'card',
  BANK_TRANSFER: 'bank_transfer',
  RAZORPAY: 'razorpay',
  PAY_AT_HOTEL: 'pay_at_hotel',
} as const;

export type PaymentMethod = (typeof PAYMENT_METHOD)[keyof typeof PAYMENT_METHOD];

export const PAYMENT_STATUS = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  FAILED: 'failed',
  REFUNDED: 'refunded',
} as const;

export type PaymentStatus = (typeof PAYMENT_STATUS)[keyof typeof PAYMENT_STATUS];

// ============================================================
// Guest ID Proof
// ============================================================

export const ID_PROOF_TYPES = {
  AADHAAR: 'aadhaar',
  PAN: 'pan',
  PASSPORT: 'passport',
  DRIVING_LICENSE: 'driving_license',
  VOTER_ID: 'voter_id',
} as const;

export type IdProofType = (typeof ID_PROOF_TYPES)[keyof typeof ID_PROOF_TYPES];

// ============================================================
// Folio Charge Categories
// ============================================================

export const CHARGE_CATEGORY = {
  ROOM: 'room',
  EXTRA_BED: 'extra_bed',
  FOOD: 'food',
  LAUNDRY: 'laundry',
  MINIBAR: 'minibar',
  SERVICE: 'service',
  OTHER: 'other',
} as const;

export type ChargeCategory = (typeof CHARGE_CATEGORY)[keyof typeof CHARGE_CATEGORY];

// ============================================================
// GST Configuration (Sep 2025 slabs)
// ============================================================

export const GST_SLABS = {
  EXEMPT: { maxTariff: 1000, rate: 0, itcEligible: false },
  FIVE_PERCENT: { maxTariff: 7500, rate: 5, itcEligible: false },
  EIGHTEEN_PERCENT: { maxTariff: Infinity, rate: 18, itcEligible: true },
} as const;

export const SAC_CODES = {
  ROOM_ACCOMMODATION: '996311',
  FOOD_AND_BEVERAGE: '996331',
} as const;

// ============================================================
// Plan Tiers
// ============================================================

export const PLAN_TIERS = {
  FREE: 'free',
  STARTER: 'starter',
  PROFESSIONAL: 'professional',
  ENTERPRISE: 'enterprise',
  CUSTOM: 'custom',
} as const;

export type PlanTier = (typeof PLAN_TIERS)[keyof typeof PLAN_TIERS];

// Payment categorisation for GuestPayment.category
export const PAYMENT_CATEGORIES = {
  PAYMENT: 'payment',
  ADVANCE: 'advance',
  SECURITY_DEPOSIT: 'security_deposit',
  REFUND: 'refund',
  SECURITY_REFUND: 'security_refund',
} as const;
export type PaymentCategory = (typeof PAYMENT_CATEGORIES)[keyof typeof PAYMENT_CATEGORIES];

// Security deposit lifecycle on a BookingRoom
export const SECURITY_DEPOSIT_STATUSES = {
  NONE: 'none',
  HELD: 'held',
  REFUNDED: 'refunded',
  FORFEITED: 'forfeited',
  PARTIAL: 'partial',
} as const;
export type SecurityDepositStatus = (typeof SECURITY_DEPOSIT_STATUSES)[keyof typeof SECURITY_DEPOSIT_STATUSES];

// ============================================================
// Interfaces
// ============================================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface TenantInfo {
  id: string;
  name: string;
  slug: string;
  customDomain?: string;
  status: TenantStatus;
  propertyType: PropertyType;
  plan: PlanTier;
}

export interface WebsiteBuilderContent {
  // ── Promo Banner ─────────────────────────────────────────────
  promotionalBanner?: {
    text: string;
    link: string;
    linkLabel: string;
    backgroundColor: string; // hex override OR 'primary' | 'accent' | 'dark'
    dismissible: boolean;
  };

  // ── Hero / Slider ─────────────────────────────────────────────
  hero?: {
    images: string[];            // ordered carousel URLs
    title: string;
    subtitle: string;
    overlayOpacity: number;      // 0-100
    ctaStyle: 'filled' | 'outline' | 'ghost';
    primaryCta?: { label: string; link: string };
    secondaryCta?: { label: string; link: string };
    whatsappNumber?: string;     // shows floating WhatsApp CTA
    videoUrl?: string;           // YouTube/Vimeo embed for video-hero
  };

  // ── About Us ──────────────────────────────────────────────────
  aboutUs?: {
    title: string;
    description: string;         // rich text paragraph
    highlights: Array<{ icon: string; label: string; value: string }>; // e.g. Est. 1995 | 200 Rooms
    image: string;               // feature image URL
    ownerName?: string;
    ownerMessage?: string;
    ownerPhoto?: string;
    layout: 'image-left' | 'image-right' | 'full-width';
  };

  // ── Quick Stats / Trust Bar ───────────────────────────────────
  stats?: {
    title?: string;
    items: Array<{ icon: string; value: string; label: string }>;      // e.g. 500+ | Happy Guests
  };

  // ── Featured Rooms ────────────────────────────────────────────
  featuredRooms?: Array<{
    linkedRoomTypeId: string;
    marketingTitleOverride?: string;
    marketingPriceOverride?: string;
    featuresOverride?: string[];
    badgeText?: string;           // e.g. "Best Seller", "New"
    imageOverride?: string;
  }>;

  // ── Amenities ─────────────────────────────────────────────────
  amenities?: {
    title: string;
    subtitle?: string;
    layout: 'grid' | 'list' | 'icon-only';
    items: Array<{ name: string; icon: string; description: string }>;
  };

  // ── Photo Gallery / Masonry ───────────────────────────────────
  photoGallery?: {
    title: string;
    subtitle?: string;
    layout: 'masonry' | 'grid-2' | 'grid-3' | 'lightbox-strip';
    images: Array<{ url: string; caption?: string; category?: string }>;
    categories?: string[];       // filter tabs e.g. "Rooms", "Pool", "Dining"
  };

  // ── Nearby Attractions ────────────────────────────────────────
  nearbyAttractions?: {
    title: string;
    subtitle?: string;
    items: Array<{ name: string; distance: string; icon?: string; category?: string }>;
  };

  // ── Location Map ─────────────────────────────────────────────
  locationMap?: {
    title: string;
    subtitle?: string;
    googleMapsEmbedUrl: string;
    address: string;
    landmark?: string;           // e.g. "Opposite MG Road Metro"
    directionsUrl?: string;      // Google Maps directions deep-link
    transportTips?: string;      // brief text about how to reach
  };

  // ── Testimonials / Reviews ────────────────────────────────────
  testimonials?: {
    title: string;
    subtitle?: string;
    layout: 'cards' | 'carousel' | 'list';
    showRating: boolean;
    items: Array<{
      guestName: string;
      location?: string;
      rating: number;
      reviewText: string;
      platform?: 'google' | 'tripadvisor' | 'booking' | 'makemytrip' | 'agoda' | 'direct';
      date?: string;
      avatarUrl?: string;
    }>;
    aggregateRating?: { score: number; count: number; platform: string };
  };

  // ── FAQ ───────────────────────────────────────────────────────
  faq?: {
    title: string;
    subtitle?: string;
    items: Array<{ q: string; a: string; category?: string }>;
  };

  // ── Call to Action (Mid-page CTA) ─────────────────────────────
  callToAction?: {
    title: string;
    subtitle?: string;
    ctaLabel: string;
    ctaLink: string;
    style: 'centered' | 'split' | 'banner';
    backgroundType: 'solid' | 'gradient' | 'image';
    backgroundValue: string;    // hex, gradient string, or image URL
    secondaryCta?: { label: string; link: string };
  };

  // ── Policies / House Rules ────────────────────────────────────
  policies?: {
    title: string;
    checkInTime: string;
    checkOutTime: string;
    cancellationPolicy: string;
    petPolicy?: string;
    smokingPolicy?: string;
    additionalRules?: string[];
  };

  // ── Awards & Certifications ───────────────────────────────────
  awards?: {
    title?: string;
    items: Array<{ name: string; year?: string; logoUrl?: string; issuer?: string }>;
  };

  // ── Footer / Contact ──────────────────────────────────────────
  contactFooter?: {
    addressHtml: string;
    googleMapsEmbedUrl: string;
    email?: string;
    phone?: string;
    whatsapp?: string;
    socialLinks: {
      facebook?: string;
      instagram?: string;
      twitter?: string;
      youtube?: string;
      whatsapp?: string;
      tripadvisor?: string;
      makemytrip?: string;
      goibibo?: string;
    };
    copyrightText: string;
    checkInRules: string;
    tagline?: string;
      footerColumns?: Array<{ heading: string; links: Array<{ label: string; url: string }> }>;
  };
}

export type ThemePreset =
  | 'corporate'          // Clean white, blue accents – B2B / business hotels
  | 'luxury_gold'        // Deep navy/black + gold – 5-star / boutique luxury
  | 'ocean_breeze'       // Aqua + sand – beach resorts, backwater lodges
  | 'forest_wellness'    // Deep greens + earthy browns – eco lodges, spa retreats
  | 'royal_heritage'     // Maroon + antique gold – heritage havelis, palace hotels
  | 'sunrise_desert'     // Terracotta + amber – Rajasthan desert camps, dry retreats
  | 'himalayan_snow'     // Ice-blue + white + slate – hill stations, mountain resorts
  | 'tropical_bloom'     // Coral + lush green – Kerala homestays, tropical resorts
  | 'urban_chic'         // Charcoal + electric teal – city boutique hotels, serviced apts
  | 'rosewater_spa'      // Blush pink + soft gold – spa resorts, women-centric retreats
  | 'midnight_modern'    // Pure dark mode, neon-accent – modern minimalist properties
  | 'saffron_festivities'; // Saffron + deep purple – wedding venues, event resorts

export interface WebsiteBuilderConfig {
  theme: ThemePreset;
  colorPalette?: {
    primaryColor: string;     // main brand color (hex)
    secondaryColor: string;   // complementary (hex)
    accentColor: string;      // CTA highlight colour (hex)
    textColor: string;        // body text override (hex)
    bgColor: string;          // page background override (hex)
  };
  typography?: {
    headingFont: 'playfair' | 'raleway' | 'poppins' | 'lora' | 'montserrat' | 'cormorant' | 'dm_sans';
    bodyFont: 'inter' | 'nunito' | 'open_sans' | 'roboto' | 'source_sans';
  };
  layout?: {
    headerStyle: 'transparent_hero' | 'solid_bar' | 'minimal_top' | 'sidebar';
    footerStyle: 'full' | 'compact' | 'minimal';
    contentWidth: 'full' | 'boxed' | 'wide';
    borderRadius: 'sharp' | 'rounded' | 'pill';
  };
  componentsEnabled: {
    promotionalBanner: boolean;
    hero: boolean;
    aboutUs: boolean;
    stats: boolean;
    featuredRooms: boolean;
    amenities: boolean;
    photoGallery: boolean;
    nearbyAttractions: boolean;
    locationMap: boolean;
    testimonials: boolean;
    callToAction: boolean;
    faq: boolean;
    policies: boolean;
    awards: boolean;
    contactFooter: boolean;
  };
  componentOrder: string[];  // ordered list of component IDs for drag-sort
  content: Record<string, WebsiteBuilderContent>;
}

export interface TenantConfig {
  fnbGstRate?: number;
  razorpayKeyId?: string;
  razorpaySecret?: string;
  upiId?: string;
  allowPayAtHotel?: boolean;
  websiteBuilder?: WebsiteBuilderConfig;
  [key: string]: any;
}

export interface UserInfo {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
}

export interface TenantMembershipInfo {
  userId: string;
  tenantId: string;
  role: Role;
  isActive: boolean;
  permissions?: Record<string, boolean>;
}

export interface RoomInfo {
  id: string;
  roomNumber: string;
  roomTypeName: string;
  floorName: string;
  status: RoomStatus;
  baseRate: number;
}

export interface BookingInfo {
  id: string;
  bookingNumber: string;
  guestName: string;
  checkInDate: string;
  checkOutDate: string;
  status: BookingStatus;
  totalAmount: number;
  numRooms: number;
}
