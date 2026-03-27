// ============================================================
// Roles & Permissions
// ============================================================

export const ROLES = {
  GLOBAL_ADMIN: 'global_admin',
  GLOBAL_SUPPORT: 'global_support',
  PROPERTY_OWNER: 'property_owner',
  GENERAL_MANAGER: 'general_manager',
  FRONT_DESK: 'front_desk',
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
  CARD: 'card',
  BANK_TRANSFER: 'bank_transfer',
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
