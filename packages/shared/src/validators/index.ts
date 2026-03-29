import { z } from 'zod';

// ============================================================
// Auth Validators
// ============================================================

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Must contain at least one number'),
  fullName: z.string().min(2, 'Full name is required').max(100),
  phone: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Must contain at least one number'),
});

export const verifyEmailSchema = z.object({
  token: z.string().min(1),
});

// ============================================================
// Property Registration Validators
// ============================================================

export const propertyRegistrationSchema = z.object({
  name: z.string().min(2, 'Property name is required').max(200),
  propertyType: z.enum(['hotel', 'lodge', 'resort', 'homestay', 'guest_house']),
  address: z.string().min(5, 'Address is required').max(500),
  city: z.string().min(2, 'City is required').max(100),
  state: z.string().min(2, 'State is required').max(100),
  pincode: z.string().regex(/^\d{6}$/, 'Invalid pincode'),
  contactPhone: z.string().min(10, 'Phone number is required').max(15),
  contactEmail: z.string().email('Invalid email'),
  gstNumber: z
    .string()
    .regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, 'Invalid GST number')
    .optional()
    .or(z.literal('')),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

// ============================================================
// Room & Floor Validators
// ============================================================

export const floorSchema = z.object({
  name: z.string().min(1, 'Floor name is required').max(100),
  sortOrder: z.number().int().min(0).default(0),
});

export const roomTypeSchema = z.object({
  name: z.string().min(1, 'Room type name is required').max(100),
  description: z.string().max(1000).optional(),
  baseOccupancy: z.number().int().min(1).max(20).default(2),
  maxOccupancy: z.number().int().min(1).max(30).default(3),
  maxExtraBeds: z.number().int().min(0).max(5).default(1),
  extraBedCharge: z.number().min(0).default(0),
  baseRate: z.number().min(0, 'Base rate is required'),
  weekendRate: z.number().min(0).optional(),
  amenities: z.array(z.string()).default([]),
});

export const roomSchema = z.object({
  floorId: z.string().uuid(),
  roomTypeId: z.string().uuid(),
  roomNumber: z.string().min(1, 'Room number is required').max(20),
  rateOverride: z.number().min(0).optional(),
  features: z.record(z.unknown()).default({}),
});

// ============================================================
// Booking Validators
// ============================================================

export const bookingSchema = z
  .object({
    guestProfileId: z.string().uuid().optional(),
    guestName: z.string().min(2).max(200),
    guestEmail: z.string().email().optional(),
    guestPhone: z.string().min(10).max(15),
    guestState: z.string().max(100).optional(),
    checkInDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    checkOutDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    numAdults: z.number().int().min(1).max(50).default(1),
    numChildren: z.number().int().min(0).max(20).default(0),
    roomSelections: z
      .array(
        z.object({
          roomTypeId: z.string().uuid(),
          roomId: z.string().uuid().optional(),
          extraBeds: z.number().int().min(0).max(5).default(0),
        }),
      )
      .min(1, 'At least one room must be selected'),
    source: z.enum(['online', 'walkin', 'ota', 'phone']).default('online'),
    specialRequests: z.string().max(1000).optional(),
    advanceAmount: z.number().min(0).optional(),
  })
  .refine((data) => new Date(data.checkOutDate) > new Date(data.checkInDate), {
    message: 'Check-out date must be after check-in date',
    path: ['checkOutDate'],
  });

// ============================================================
// Guest Validators
// ============================================================

export const guestSchema = z.object({
  fullName: z.string().min(2, 'Name is required').max(200),
  phone: z.string().min(10).max(15).optional(),
  email: z.string().email().optional(),
  nationality: z.string().max(50).default('Indian'),
  dateOfBirth: z.string().optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  idProofType: z.enum(['aadhaar', 'pan', 'passport', 'driving_license', 'voter_id']).optional(),
  idProofNumber: z.string().max(50).optional(),
  address: z.string().max(500).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  pincode: z.string().max(10).optional(),
});

// ============================================================
// Check-in Validators
// ============================================================

export const checkInSchema = z.object({
  roomAssignments: z
    .array(
      z.object({
        bookingRoomId: z.string().uuid(),
        roomId: z.string().uuid(),
      }),
    )
    .optional(),
  guestDetails: z
    .array(
      z.object({
        fullName: z.string().min(2),
        idProofType: z.enum(['aadhaar', 'pan', 'passport', 'driving_license', 'voter_id']),
        idProofNumber: z.string().min(4).max(50),
        nationality: z.string().default('Indian'),
      }),
    )
    .optional(),
});

export const checkOutSchema = z.object({
  paymentMethod: z.enum(['cash', 'upi', 'card', 'bank_transfer']).optional(),
  settledAmount: z.number().min(0).optional(),
  notes: z.string().max(500).optional(),
});

// ============================================================
// Billing Validators
// ============================================================

export const folioChargeSchema = z.object({
  bookingId: z.string().uuid(),
  chargeDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  category: z.enum(['room', 'extra_bed', 'food', 'laundry', 'minibar', 'service', 'other']),
  description: z.string().min(1).max(255),
  quantity: z.number().int().min(1).default(1),
  unitPrice: z.number().min(0),
  sacCode: z.string().optional(),
});

export const paymentSchema = z.object({
  bookingId: z.string().uuid(),
  amount: z.number().min(0.01, 'Amount must be positive'),
  method: z.enum(['cash', 'upi', 'card', 'bank_transfer']),
});

// ============================================================
// Staff Invite Validators
// ============================================================

export const staffInviteSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: z.enum([
    'general_manager',
    'front_desk',
    'housekeeping',
    'accountant',
  ]),
  fullName: z.string().min(2).max(100),
});

// ============================================================
// Branding Validators
// ============================================================

export const brandingSchema = z.object({
  brandLogo: z.string().url().optional(),
  primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  secondaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  tagline: z.string().max(200).optional(),
  heroImage: z.string().url().optional(),
});
