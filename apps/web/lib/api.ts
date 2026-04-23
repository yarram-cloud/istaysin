const API_URL = process.env.NEXT_PUBLIC_API_URL || 
  (typeof window === 'undefined' ? 'http://localhost:4100/api/v1' : '/api/v1');

interface FetchOptions extends RequestInit {
  token?: string;
  tenantId?: string;
}

export async function apiFetch<T = any>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const { token, tenantId, ...fetchOptions } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  // Add auth token from localStorage
  const authToken = token || (typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null);
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  // Add tenant ID
  const tenant = tenantId || (typeof window !== 'undefined' ? localStorage.getItem('tenantId') : null);
  if (tenant) {
    headers['x-tenant-id'] = tenant;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    cache: 'no-store',
    ...fetchOptions,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    if (response.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      localStorage.removeItem('tenantId');
      document.cookie = 'accessToken=; path=/; max-age=0';
      
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login?reason=timeout';
      }
    }
    throw new Error(data.error || `API error: ${response.status}`);
  }

  return data;
}

// Helper to get tenantId from localStorage
function getTenantId(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('tenantId') || '';
}

// Helper to save auth data after login/register
export function saveAuthData(data: { accessToken: string; refreshToken: string; user: any; tenantId?: string }) {
  localStorage.setItem('accessToken', data.accessToken);
  localStorage.setItem('refreshToken', data.refreshToken);
  localStorage.setItem('user', JSON.stringify(data.user));
  if (data.tenantId) {
    localStorage.setItem('tenantId', data.tenantId);
  }
  // Set cookie for Next.js middleware
  document.cookie = `accessToken=${data.accessToken}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
}

// Auth helpers
export const authApi = {
  register: (body: { email: string; password: string; fullName: string; phone: string; otpCode: string }) =>
    apiFetch('/auth/register', { method: 'POST', body: JSON.stringify(body) }),

  sendWhatsappOtp: (body: { phone: string }) =>
    apiFetch('/auth/send-whatsapp-otp', { method: 'POST', body: JSON.stringify(body) }),

  login: (body: { identifier: string; password: string }) =>
    apiFetch('/auth/login', { method: 'POST', body: JSON.stringify(body) }),

  me: () => apiFetch('/auth/me'),

  refreshToken: (refreshToken: string) =>
    apiFetch('/auth/refresh-token', { method: 'POST', body: JSON.stringify({ refreshToken }) }),

  updateLanguage: (language: string) =>
    apiFetch('/auth/me/language', { method: 'PUT', body: JSON.stringify({ language }) }),
};

// Tenants helpers
// Backend routes: PATCH /tenants/:id/settings, PATCH /tenants/:id/branding, POST /tenants/:id/invite-staff
export const tenantsApi = {
  registerProperty: (body: any) =>
    apiFetch('/tenants/register-property', { method: 'POST', body: JSON.stringify(body) }),

  myProperties: () => apiFetch('/tenants/my-properties'),

  getSettings: () => {
    const id = getTenantId();
    if (!id) return apiFetch('/tenants/my-properties').then((res: any) => ({ success: true, data: res.data?.[0] || {} }));
    return apiFetch(`/tenants/${id}/settings`);
  },

  updateSettings: (body: any) => {
    const id = getTenantId();
    return apiFetch(`/tenants/${id}/settings`, { method: 'PATCH', body: JSON.stringify(body) });
  },

  getBranding: () => {
    const id = getTenantId();
    return apiFetch('/tenants/my-properties').then((res: any) => {
      const tenant = res.data?.find((t: any) => t.id === id) || res.data?.[0];
      return { success: true, data: tenant || {} };
    });
  },

  updateBranding: (body: any) => {
    const id = getTenantId();
    return apiFetch(`/tenants/${id}/branding`, { method: 'PATCH', body: JSON.stringify(body) });
  },

  inviteStaff: (body: { phone: string; passcode: string; role: string; fullName: string }) => {
    const id = getTenantId();
    return apiFetch(`/tenants/${id}/invite-staff`, { method: 'POST', body: JSON.stringify(body) });
  },

  updateStaffStatus: (userId: string, body: { isActive: boolean }) => {
    const id = getTenantId();
    return apiFetch(`/tenants/${id}/staff/${userId}/status`, { method: 'PUT', body: JSON.stringify(body) });
  },

  // No dedicated GET staff endpoint in backend - we need to add one
  getStaff: () => apiFetch('/tenants/staff'),

  removeStaff: (userId: string) =>
    apiFetch(`/tenants/staff/${userId}`, { method: 'DELETE' }),
};

// Dashboard helpers
export const dashboardApi = {
  get: () => apiFetch('/dashboard'),
};

// Rooms helpers
// Backend routes: GET /floors, POST /floors, GET /types, POST /types, GET /, POST /, PATCH /:id/status, GET /availability
export const roomsApi = {
  // Floors
  getFloors: () => apiFetch('/rooms/floors'),
  createFloor: (body: { name: string; sortOrder: number }) =>
    apiFetch('/rooms/floors', { method: 'POST', body: JSON.stringify(body) }),
  updateFloor: (id: string, body: { name: string; sortOrder: number }) =>
    apiFetch(`/rooms/floors/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  // No DELETE /floors/:id in backend - we need to add it
  deleteFloor: (id: string) => apiFetch(`/rooms/floors/${id}`, { method: 'DELETE' }),

  // Room Types
  getRoomTypes: () => apiFetch('/rooms/types'),
  createRoomType: (body: { name: string; maxOccupancy: number; baseRate: number; pricingUnit: string; description?: string }) =>
    apiFetch('/rooms/types', { method: 'POST', body: JSON.stringify(body) }),
  // No DELETE /types/:id in backend - we need to add it
  deleteRoomType: (id: string) => apiFetch(`/rooms/types/${id}`, { method: 'DELETE' }),

  // Rooms
  getRooms: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return apiFetch(`/rooms${query}`);
  },
  createRoom: (body: { roomNumber: string; floorId: string; roomTypeId: string; baseRate?: number }) =>
    apiFetch('/rooms', { method: 'POST', body: JSON.stringify(body) }),
  // No PUT /:id in backend - we need to add it
  updateRoom: (id: string, body: any) =>
    apiFetch(`/rooms/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  // No DELETE /:id in backend - we need to add it
  deleteRoom: (id: string) => apiFetch(`/rooms/${id}`, { method: 'DELETE' }),
  // PATCH /:id/status exists in backend
  updateStatus: (id: string, status: string) =>
    apiFetch(`/rooms/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  checkAvailability: (checkIn: string, checkOut: string) =>
    apiFetch(`/rooms/availability?checkIn=${checkIn}&checkOut=${checkOut}`),
  getAvailabilityGrid: (startDate: string, endDate: string) =>
    apiFetch(`/rooms/availability-grid?startDate=${startDate}&endDate=${endDate}`),
};

// Bookings helpers
// Backend routes: POST /, GET /, GET /:id, PATCH /:id/confirm, POST /:id/cancel, POST /walk-in
export const bookingsApi = {
  create: (body: any) => apiFetch('/bookings', { method: 'POST', body: JSON.stringify(body) }),
  walkIn: (body: any) => apiFetch('/bookings/walk-in', { method: 'POST', body: JSON.stringify(body) }),
  list: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return apiFetch(`/bookings${query}`);
  },
  get: (id: string) => apiFetch(`/bookings/${id}`),
  confirm: (id: string) => apiFetch(`/bookings/${id}/confirm`, { method: 'PATCH' }),
  cancel: (id: string, reason?: string) =>
    apiFetch(`/bookings/${id}/cancel`, { method: 'POST', body: JSON.stringify({ reason }) }),
  update: (id: string, body: any) =>
    apiFetch(`/bookings/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  assignRoom: (bookingId: string, body: { bookingRoomId: string; roomId: string }) =>
    apiFetch(`/bookings/${bookingId}/assign-room`, { method: 'PUT', body: JSON.stringify(body) }),
};

// Guests helpers
export const guestsApi = {
  list: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return apiFetch(`/guests${query}`);
  },
  get: (id: string) => apiFetch(`/guests/${id}`),
  create: (body: any) => apiFetch('/guests', { method: 'POST', body: JSON.stringify(body) }),
  search: (q: string) => apiFetch(`/guests?search=${encodeURIComponent(q)}`),
};

// Check-in / Check-out helpers
export const checkinApi = {
  checkIn: (bookingId: string, body: any) =>
    apiFetch(`/check-in-out/${bookingId}/check-in`, { method: 'POST', body: JSON.stringify(body) }),
  checkOut: (bookingId: string, body?: any) =>
    apiFetch(`/check-in-out/${bookingId}/check-out`, { method: 'POST', body: JSON.stringify(body || {}) }),
};

// Billing helpers
// Backend routes: GET /:bookingId/folio, POST /charge, POST /payment, GET /invoices
export const billingApi = {
  getInvoices: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return apiFetch(`/billing/invoices${query}`);
  },
  getInvoice: (id: string) => apiFetch(`/billing/invoices/${id}`),
  getFolio: (bookingId: string) => apiFetch(`/billing/${bookingId}/folio`),
  addCharge: (body: any) =>
    apiFetch('/billing/charge', { method: 'POST', body: JSON.stringify(body) }),
  recordPayment: (body: any) =>
    apiFetch('/billing/payment', { method: 'POST', body: JSON.stringify(body) }),
};

// Payment gateway helpers
export const paymentsApi = {
  getUpiQr: (bookingId: string) => apiFetch(`/payments/upi/qr?bookingId=${bookingId}`),
  createRazorpayOrder: (body: { bookingId: string; amount: number }) => 
    apiFetch('/payments/razorpay/order', { method: 'POST', body: JSON.stringify(body) }),
  verifyRazorpayPayment: (body: { bookingId: string; amount: number; paymentId: string; orderId: string; signature: string }) => 
    apiFetch('/payments/razorpay/verify', { method: 'POST', body: JSON.stringify(body) }),
};

// Housekeeping helpers
// Backend routes: GET /tasks, PATCH /tasks/:id/status, POST /maintenance
export const housekeepingApi = {
  getTasks: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return apiFetch(`/housekeeping/tasks${query}`);
  },
  getStaff: () => apiFetch('/housekeeping/staff'),
  updateStatus: (taskId: string, status: string) =>
    apiFetch(`/housekeeping/tasks/${taskId}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  updateTask: (taskId: string, body: any) =>
    apiFetch(`/housekeeping/tasks/${taskId}`, { method: 'PATCH', body: JSON.stringify(body) }),
  createTask: (body: any) =>
    apiFetch('/housekeeping/tasks', { method: 'POST', body: JSON.stringify(body) }),
};

// Analytics helpers
// Backend routes: GET /occupancy, GET /revenue, GET /booking-sources (3 separate endpoints)
export const analyticsApi = {
  getOccupancy: () => apiFetch('/analytics/occupancy'),
  getRevenue: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return apiFetch(`/analytics/revenue${query}`);
  },
  getBookingSources: () => apiFetch('/analytics/booking-sources'),
  // Convenience: fetch all three in parallel
  getOverview: async () => {
    try {
      const [occupancy, revenue, sources] = await Promise.allSettled([
        apiFetch('/analytics/occupancy'),
        apiFetch('/analytics/revenue'),
        apiFetch('/analytics/booking-sources'),
      ]);
      const occ = occupancy.status === 'fulfilled' ? occupancy.value.data : {};
      const rev = revenue.status === 'fulfilled' ? revenue.value.data : {};
      const src = sources.status === 'fulfilled' ? sources.value.data : [];

      // Transform booking sources array into Record
      const bookingSources: Record<string, number> = {};
      if (Array.isArray(src)) {
        src.forEach((s: any) => { bookingSources[s.source] = s.count; });
      }

      return {
        success: true,
        data: {
          occupancy: {
            current: occ.occupiedRooms || 0,
            total: occ.totalRooms || 0,
            percent: occ.occupancyPercent || 0,
          },
          revenue: {
            today: 0, // Not available from current API
            thisMonth: rev.totalRevenue || 0,
            lastMonth: 0, // Would need separate call with dates
          },
          bookings: {
            today: 0,
            thisMonth: rev.totalBookings || 0,
            pending: 0,
          },
          guestCount: 0,
          bookingSources,
        },
      };
    } catch {
      return { success: false, data: null };
    }
  },
};

// Pricing helpers
export const pricingApi = {
  getRules: () => apiFetch('/pricing'),
  createRule: (body: any) => apiFetch('/pricing', { method: 'POST', body: JSON.stringify(body) }),
  updateRule: (id: string, body: any) => apiFetch(`/pricing/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteRule: (id: string) => apiFetch(`/pricing/${id}`, { method: 'DELETE' }),
};

// Public helpers (no auth needed)
export const publicApi = {
  properties: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return apiFetch(`/public/properties${query}`);
  },
  property: (slug: string) => apiFetch(`/public/properties/${slug}`),
  getAvailabilityHints: (slug: string) => apiFetch(`/public/properties/${slug}/availability-hints`),
  search: (q: string) => apiFetch(`/public/search?q=${encodeURIComponent(q)}`),
  createBooking: (body: any) => apiFetch('/public/bookings', { method: 'POST', body: JSON.stringify(body) }),
  createRazorpayOrder: (body: { bookingId: string; amount: number }) => 
    apiFetch('/public/payments/razorpay/order', { method: 'POST', body: JSON.stringify(body) }),
  verifyRazorpayPayment: (body: { bookingId: string; amount: number; paymentId: string; orderId: string; signature: string }) => 
    apiFetch('/public/payments/razorpay/verify', { method: 'POST', body: JSON.stringify(body) }),
};

// Platform Admin helpers (requires isGlobalAdmin)
export const platformApi = {
  getAnalytics: () => apiFetch('/platform/analytics'),
  getRegistrations: (status = 'pending_approval') =>
    apiFetch(`/platform/registrations?status=${status}`),
  approveProperty: (id: string) =>
    apiFetch(`/platform/approve/${id}`, { method: 'POST' }),
  rejectProperty: (id: string, reason?: string) =>
    apiFetch(`/platform/reject/${id}`, { method: 'POST', body: JSON.stringify({ reason }) }),
  getTenants: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return apiFetch(`/platform/tenants${query}`);
  },
};

// Reviews helpers
export const reviewsApi = {
  getReviews: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return apiFetch(`/reviews${query}`);
  },
  replyReview: (id: string, ownerReply: string) =>
    apiFetch(`/reviews/${id}/reply`, { method: 'PATCH', body: JSON.stringify({ ownerReply }) }),
  publishReview: (id: string, isPublished: boolean) =>
    apiFetch(`/reviews/${id}/publish`, { method: 'PATCH', body: JSON.stringify({ isPublished }) }),
  deleteReview: (id: string) =>
    apiFetch(`/reviews/${id}`, { method: 'DELETE' }),
  publicSubmit: (body: any) =>
    apiFetch('/public/reviews', { method: 'POST', body: JSON.stringify(body) }),
};

// Shifts helpers
export const shiftsApi = {
  list: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return apiFetch(`/shifts${query}`);
  },
  create: (body: any) => apiFetch('/shifts', { method: 'POST', body: JSON.stringify(body) }),
  update: (id: string, body: any) => apiFetch(`/shifts/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (id: string) => apiFetch(`/shifts/${id}`, { method: 'DELETE' }),
};

// Channels helpers
export const channelsApi = {
  list: () => apiFetch('/channels'),
  create: (body: any) => apiFetch('/channels', { method: 'POST', body: JSON.stringify(body) }),
  delete: (id: string) => apiFetch(`/channels/${id}`, { method: 'DELETE' }),
  addMapping: (id: string, body: any) => apiFetch(`/channels/${id}/mappings`, { method: 'POST', body: JSON.stringify(body) }),
};

// Loyalty helpers
export const loyaltyApi = {
  getAccount: () => apiFetch('/loyalty/account'),
  getTransactions: (page = 1) => apiFetch(`/loyalty/transactions?page=${page}`),
  listRewards: () => apiFetch('/loyalty/rewards'),
  createReward: (body: any) => apiFetch('/loyalty/rewards', { method: 'POST', body: JSON.stringify(body) }),
  updateReward: (id: string, body: any) => apiFetch(`/loyalty/rewards/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteReward: (id: string) => apiFetch(`/loyalty/rewards/${id}`, { method: 'DELETE' }),
  redeem: (body: { rewardId: string; bookingId?: string }) =>
    apiFetch('/loyalty/redeem', { method: 'POST', body: JSON.stringify(body) }),
};

// Next.js internal helpers (bypasses default API_URL pointing to port 4100)
export const uploadApi = {
  uploadFile: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    
    // Explicitly call the Next.js internal /api route handlers
    const res = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
      // Note: do not set Content-Type header manually, let the browser set it with boundary
    });
    
    if (!res.ok) {
      throw new Error('Upload failed');
    }
    return res.json();
  }
};
export const couponsApi = {
  list: () => apiFetch('/coupons'),
  create: (body: any) => apiFetch('/coupons', { method: 'POST', body: JSON.stringify(body) }),
  patch: (id: string, body: any) => apiFetch(`/coupons/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: (id: string) => apiFetch(`/coupons/${id}`, { method: 'DELETE' }),
  validate: (body: { code: string; bookingAmount: number; roomTypeId: string; checkIn: string }, tenantId?: string) => 
    apiFetch('/coupons/validate', { method: 'POST', body: JSON.stringify(body), tenantId }),
};
