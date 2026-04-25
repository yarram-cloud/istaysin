import { z } from 'zod';

// ============================================================
// Auth Validators
// ============================================================

export const passcodeValidator = z.string().regex(/^[0-9]+$/, 'Passcode must contain only numbers').min(6, 'Passcode must be at least 6 characters').max(8, 'Passcode must not exceed 8 characters');
export const passwordValidator = z.string().min(6, 'Password must be at least 6 characters').max(100);

export const registerSchema = z.object({
  email: z.string().email('Invalid email address').optional(),
  password: passwordValidator,
  fullName: z.string().min(2, 'Full name is required').max(100),
  phone: z.string().min(10, 'Phone is required').max(15),
});

export const loginSchema = z.object({
  identifier: z.string().min(5, 'Email or Phone is required').max(200),
  password: passwordValidator,
});

export const forgotPasswordSchema = z.object({
  identifier: z.string().min(5, 'Email or Phone is required').max(200),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: passwordValidator,
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
  pricingUnit: z.enum(['nightly', 'monthly']).default('nightly'),
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
    guestEmail: z.string().email().optional().or(z.literal('')),
    guestPhone: z.string().min(8).max(20),
    guestNationality: z.string().max(100).optional(),
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
          extraBedCharge: z.number().min(0).default(0),
          baseRateOverride: z.number().min(0).optional(),
        }),
      )
      .min(1, 'At least one room must be selected'),
    source: z.enum(['online', 'walkin', 'ota', 'phone', 'email', 'website', 'ota_booking_com', 'ota_makemytrip', 'ota_goibibo', 'agent']).default('online'),
    specialRequests: z.string().max(1000).optional(),
    advanceAmount: z.number().min(0).optional(),
    paymentMode: z.enum(['online', 'pay_at_hotel']).default('online'),
    promoCode: z.string().max(50).optional(),
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
  phone: z.string().min(8, 'Phone number is too short').max(20),
  email: z.string().email().optional().or(z.literal('')),
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
        roomId: z.string(), // Allowing roomNumber to be typed by frontdesk
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
        visaNumber: z.string().optional(),
        visaExpiryDate: z.string().optional(),
        arrivingFrom: z.string().optional(),
        goingTo: z.string().optional(),
        purposeOfVisit: z.string().optional()
      }),
    )
    .optional(),
});

export const checkOutSchema = z.object({
  paymentMethod: z.enum(['cash', 'upi', 'card', 'bank_transfer']).optional(),
  settledAmount: z.number().min(0).optional(),
  discountAmount: z.number().min(0).optional(),
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
  phone: z.string().min(10, 'Phone is required').max(15),
  passcode: passcodeValidator,
  role: z.enum([
    'general_manager',
    'front_desk',
    'housekeeping',
    'accountant',
  ]),
  fullName: z.string().min(2).max(100),
});

export const updateStaffStatusSchema = z.object({
  isActive: z.boolean(),
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

// ============================================================
// Booking Guest Validators
// ============================================================

export const bookingGuestSchema = z.object({
  fullName: z.string().min(2).max(100),
  nationality: z.string().optional(),
  idProofType: z.string().optional(),
  idProofNumber: z.string().optional(),
  visaNumber: z.string().optional(),
  visaExpiryDate: z.string().refine(
    (v) => !isNaN(Date.parse(v)),
    { message: 'Invalid date format' }
  ).optional().nullable(),
  purposeOfVisit: z.string().optional(),
  arrivingFrom: z.string().optional(),
  goingTo: z.string().optional(),
});

export const walkInBookingSchema = z.object({
  guestName: z.string().min(2).max(100),
  guestPhone: z.string().min(10, 'Phone must be at least 10 digits').max(18),
  roomId: z.string().uuid(),
  durationValue: z.number().int().min(1).max(365),
  durationUnit: z.enum(['days', 'months']),
  paymentMode: z.enum(['cash', 'upi', 'card']).optional(),
});

// ============================================================
// Coupon Validators
// ============================================================

export const couponSchema = z.object({
  code: z.string().min(3).max(50).regex(/^[A-Z0-9_-]+$/, 'Code must be uppercase alphanumeric'),
  discountType: z.enum(['percentage', 'flat']),
  discountValue: z.number().positive(),
  maxUses: z.number().int().positive().optional().nullable(),
  minBookingAmount: z.number().min(0).default(0),
  validFrom: z.string().optional().nullable(),
  validUntil: z.string().optional().nullable(),
  applicableRoomTypes: z.array(z.string().uuid()).default([]),
  isActive: z.boolean().default(true),
});

export const validateCouponSchema = z.object({
  code: z.string().min(1),
  bookingAmount: z.number().positive(),
  roomTypeId: z.string().uuid(),
  checkIn: z.string(),
});

// ============================================================
// Auth Router Schemas
// ============================================================
export const whatsappOtpSchema = z.object({
  phone: z.string().min(10, 'Phone must be at least 10 digits').max(15)
});

export const verifyOtpSchema = z.object({
  phone: z.string().min(10).max(15),
  otp: z.string().min(4).max(6)
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1)
});

export const updateLanguageSchema = z.object({
  language: z.enum(['en', 'hi', 'ta', 'te', 'mr', 'bn', 'gu', 'kn', 'ml', 'pa'])
});

// ============================================================
// Bookings Router Additional Schemas
// ============================================================
export const confirmBookingSchema = z.object({
  paymentMode: z.enum(['online', 'pay_at_hotel', 'cash', 'card', 'upi', 'bank_transfer']),
  amount: z.number().min(0)
});

export const cancelBookingSchema = z.object({
  reason: z.string().min(1).max(500).optional()
});

export const assignRoomSchema = z.object({
  bookingRoomId: z.string().uuid(),
  roomId: z.string().uuid()
});

export const updateBookingSchema = z.object({
  guestName: z.string().min(2).max(100).optional(),
  guestPhone: z.string().min(10).max(15).optional(),
  guestEmail: z.string().email().optional().or(z.literal('')),
  notes: z.string().max(1000).optional(),
  checkInDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  checkOutDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

// ============================================================
// Housekeeping Router Schemas
// ============================================================
export const updateTaskStatusSchema = z.object({
  status: z.enum(['pending', 'in_progress', 'completed', 'verified', 'cancelled']),
  notes: z.string().max(500).optional()
});

export const updateTaskSchema = z.object({
  status: z.enum(['pending', 'in_progress', 'completed', 'verified', 'cancelled']).optional(),
  assignedTo: z.string().uuid().optional().nullable(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  notes: z.string().max(500).optional()
});

export const createTaskSchema = z.object({
  roomId: z.string().uuid().optional().nullable(),
  taskType: z.enum(['cleaning', 'inspection', 'maintenance', 'turndown', 'setup', 'other']),
  status: z.enum(['pending', 'in_progress', 'completed', 'verified', 'cancelled']).default('pending'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  assignedTo: z.string().uuid().optional().nullable(),
  notes: z.string().max(1000).optional()
});

export const createMaintenanceSchema = z.object({
  roomId: z.string().uuid(),
  issueType: z.string().min(1).max(100),
  description: z.string().min(1).max(1000),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
});

// ============================================================
// Notifications Router Schemas
// ============================================================
export const markNotificationReadSchema = z.object({
  isRead: z.boolean()
});

export const markAllNotificationsReadSchema = z.object({
  type: z.string().optional()
});

// ============================================================
// Payments Router Schemas
// ============================================================
export const createRazorpayOrderSchema = z.object({
  amount: z.number().positive(),
  receipt: z.string().min(1).max(50),
  bookingId: z.string().uuid().optional()
});

export const verifyRazorpayOrderSchema = z.object({
  razorpay_order_id: z.string().min(1),
  razorpay_payment_id: z.string().min(1),
  razorpay_signature: z.string().min(1),
  bookingId: z.string().uuid().optional()
});

// ============================================================
// Platform Router Schemas
// ============================================================
export const platformApproveSchema = z.object({
  notes: z.string().max(1000).optional()
});

export const platformRejectSchema = z.object({
  reason: z.string().min(1).max(1000)
});

// ============================================================
// POS Router Schemas
// ============================================================
export const voidPosOrderSchema = z.object({
  reason: z.string().min(1).max(500)
});

// ============================================================
// Pricing Router Schemas
// ============================================================
export const createPricingSchema = z.object({
  roomTypeId: z.string().uuid(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  rate: z.number().min(0),
  minStay: z.number().int().min(1).optional(),
  isBlocked: z.boolean().default(false)
});

export const updatePricingSchema = z.object({
  rate: z.number().min(0).optional(),
  minStay: z.number().int().min(1).optional(),
  isBlocked: z.boolean().optional()
});

// ============================================================
// Reviews Router Schemas
// ============================================================
export const createReviewSchema = z.object({
  bookingId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(2000).optional()
});

export const publishReviewSchema = z.object({
  isPublished: z.boolean()
});

export const replyReviewSchema = z.object({
  reply: z.string().min(1).max(2000)
});

// ============================================================
// Rooms Router Schemas
// ============================================================
export const updateRoomSchema = z.object({
  roomNumber: z.string().min(1).max(20).optional(),
  roomTypeId: z.string().uuid().optional(),
  floorId: z.string().uuid().optional(),
  // Canonical status list — must match PATCH /:id/status validation in rooms router
  status: z.enum(['available', 'occupied', 'blocked', 'maintenance', 'dirty', 'cleaning']).optional(),
  rateOverride: z.number().min(0).optional().nullable(),
});

export const updateRoomStatusSchema = z.object({
  // Canonical status list — must match rooms/page.tsx STATUS_OPTIONS and router.ts validation
  status: z.enum(['available', 'occupied', 'blocked', 'maintenance', 'dirty', 'cleaning'])
});

// ============================================================
// Users Router Schemas
// ============================================================
export const updateProfileSchema = z.object({
  fullName: z.string().min(2).max(100).optional(),
  phone: z.string().min(10).max(20).optional(),
  email: z.string().email().optional().or(z.literal('')),
  avatarUrl: z.string().url().optional().or(z.literal(''))
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6).max(100)
});

// ============================================================
// Channels Webhook Schema
// ============================================================
export const channelWebhookSchema = z.record(z.unknown());

// ============================================================
// Groups Router Schema
// ============================================================
export const createGroupBlockSchema = z.object({
  name: z.string().min(2).max(200),
  company: z.string().max(200).optional(),
  checkInDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  checkOutDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  status: z.enum(['tentative', 'confirmed', 'cancelled']).default('tentative'),
  roomsAssigned: z.number().int().min(1)
});
