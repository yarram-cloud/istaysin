const API_URL = process.env.NEXT_PUBLIC_API_URL || 
  (typeof window === 'undefined' ? 'http://localhost:4100/api/v1' : '/api/v1');

// Mutex to prevent concurrent refresh attempts
let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

async function attemptTokenRefresh(): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  const refreshToken = localStorage.getItem('refreshToken');
  if (!refreshToken) return null;

  try {
    const res = await fetch(`${API_URL}/auth/refresh-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const newToken = data.data?.accessToken;
    if (newToken) {
      localStorage.setItem('accessToken', newToken);
      document.cookie = `accessToken=${newToken}; path=/; max-age=${60 * 60 * 8}; SameSite=Lax`;
      return newToken;
    }
    return null;
  } catch {
    return null;
  }
}

interface FetchOptions extends RequestInit {
  token?: string;
  tenantId?: string;
}

/**
 * Invalidate one or more SWR cache slots after a successful write.
 * Helpers in this file call it so call sites cannot forget. Lazy-imports
 * SWR so this module stays SSR-safe.
 *
 *   await invalidateAfterWrite('/tenants/123/settings');     // exact key
 *   await invalidateAfterWrite('/platform/revenue', { prefix: true });  // all variants
 */
async function invalidateAfterWrite(
  endpoint: string,
  opts: { prefix?: boolean } = {},
): Promise<void> {
  if (typeof window === 'undefined') return;
  try {
    const mod = await import('./use-api');
    if (opts.prefix) await mod.invalidateApiPrefix(endpoint);
    else await mod.invalidateApiKey(endpoint);
  } catch {
    // SWR not loaded — fine, nothing was cached yet.
  }
}

/**
 * Clear every client-side auth artifact: localStorage tokens, the auth cookie,
 * and (lazily) the SWR in-memory cache so PII does not survive a session
 * boundary on a shared device. Safe no-op outside the browser.
 *
 * SWR is dynamically imported because `lib/api.ts` is also used from Server
 * Components — pulling in SWR's React-only module statically would break SSR.
 */
export async function clearClientAuth(): Promise<void> {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
  localStorage.removeItem('tenantId');
  localStorage.removeItem('tenant_id');
  localStorage.removeItem('memberships');
  document.cookie = 'accessToken=; path=/; max-age=0';
  try {
    const { clearAllSwrCache } = await import('./use-api');
    await clearAllSwrCache();
  } catch {
    // SWR not loaded yet (e.g. during the very first request on cold load) — fine.
  }
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
  const tenant = tenantId || (typeof window !== 'undefined' ? (localStorage.getItem('tenantId') || localStorage.getItem('tenant_id')) : null) || 'unassigned';
  if (tenant) {
    headers['x-tenant-id'] = tenant;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    cache: 'no-store',
    ...fetchOptions,
    headers,
  });

  // If 401 and not the refresh endpoint itself, try silent refresh
  if (response.status === 401 && typeof window !== 'undefined' && !endpoint.includes('/auth/')) {
    // Use mutex to prevent concurrent refresh storms
    if (!isRefreshing) {
      isRefreshing = true;
      refreshPromise = attemptTokenRefresh().finally(() => { isRefreshing = false; });
    }

    const newToken = await refreshPromise;
    if (newToken) {
      // Retry the original request with the new token
      headers['Authorization'] = `Bearer ${newToken}`;
      const retryResponse = await fetch(`${API_URL}${endpoint}`, {
        cache: 'no-store',
        ...fetchOptions,
        headers,
      });
      const retryData = await retryResponse.json();
      if (!retryResponse.ok) {
        throw new Error(retryData.error || `API error: ${retryResponse.status}`);
      }
      return retryData;
    }

    // Refresh failed — clear auth and redirect to login
    await clearClientAuth();

    if (!window.location.pathname.includes('/login')) {
      window.location.href = '/login?reason=timeout';
    }
    throw new Error('Session expired. Please log in again.');
  }

  let data: any;
  const contentType = response.headers.get('content-type');
  
  if (contentType && contentType.includes('application/json')) {
    data = await response.json();
  } else {
    const text = await response.text();
    // If it is not JSON, it is likely a server error (HTML)
    if (!response.ok) {
       console.error(`API Error (${response.status}):`, text.slice(0, 1000));
       throw new Error(`Server returned an error (${response.status}). Please check console for details.`);
    }
    // If it's OK but not JSON, still try to return something or throw
    data = { success: true, message: text };
  }

  if (!response.ok) {
    if (response.status === 401 && typeof window !== 'undefined') {
      await clearClientAuth();
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login?reason=timeout';
      }
    }
    throw new Error(data?.error || `API error: ${response.status}`);
  }

  return data;
}

// Helper to get tenantId from localStorage
function getTenantId(): string {
  if (typeof window === 'undefined') return 'unassigned';
  return localStorage.getItem('tenantId') || localStorage.getItem('tenant_id') || 'unassigned';
}

// Helper to save auth data after login/register
export function saveAuthData(data: { accessToken: string; refreshToken: string; user: any; tenantId?: string; memberships?: any[] }) {
  localStorage.setItem('accessToken', data.accessToken);
  localStorage.setItem('refreshToken', data.refreshToken);
  localStorage.setItem('user', JSON.stringify(data.user));

  // Always reset stale tenant/membership data from previous sessions
  localStorage.removeItem('tenantId');
  localStorage.removeItem('tenant_id');
  localStorage.removeItem('memberships');

  if (data.tenantId) {
    localStorage.setItem('tenantId', data.tenantId);
    localStorage.setItem('tenant_id', data.tenantId);
  }
  if (data.memberships) {
    localStorage.setItem('memberships', JSON.stringify(data.memberships));
  }
  // Set cookie for Next.js middleware
  document.cookie = `accessToken=${data.accessToken}; path=/; max-age=${60 * 60 * 8}; SameSite=Lax`;
}

// Auth helpers
export const authApi = {
  register: (body: { phone: string; password: string; fullName: string; email?: string; otpCode: string }) =>
    apiFetch('/auth/register', { method: 'POST', body: JSON.stringify(body) }),

  sendWhatsappOtp: (body: { phone: string }) =>
    apiFetch('/auth/send-whatsapp-otp', { method: 'POST', body: JSON.stringify(body) }),

  resetPassword: (body: { phone: string; otpCode: string; newPassword: string }) =>
    apiFetch('/auth/reset-password', { method: 'POST', body: JSON.stringify(body) }),

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

  updateSettings: async (body: any) => {
    const id = getTenantId();
    const res = await apiFetch(`/tenants/${id}/settings`, { method: 'PATCH', body: JSON.stringify(body) });
    // Auto-invalidate the SWR cache slot that backs the website builder /
    // settings page. Done here so call sites cannot forget.
    await invalidateAfterWrite(`/tenants/${id}/settings`);
    return res;
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

  getSetupProgress: () => apiFetch('/tenants/setup-progress'),
  skipSetupStep: (stepId: string) => apiFetch('/tenants/skip-setup-step', { method: 'POST', body: JSON.stringify({ stepId }) }),
};

// Dashboard helpers
export const dashboardApi = {
  get: () => apiFetch('/dashboard'),
};

// Rooms helpers
// Backend routes: GET /floors, POST /floors, PUT /floors/:id, DELETE /floors/:id
//                 GET /types, POST /types, PUT /types/:id, DELETE /types/:id
//                 GET /, POST /, PUT /:id, DELETE /:id, PATCH /:id/status, GET /availability
export const roomsApi = {
  // Floors
  getFloors: () => apiFetch('/rooms/floors'),
  createFloor: (body: { name: string; sortOrder: number }) =>
    apiFetch('/rooms/floors', { method: 'POST', body: JSON.stringify(body) }),
  updateFloor: (id: string, body: { name: string; sortOrder: number }) =>
    apiFetch(`/rooms/floors/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteFloor: (id: string) => apiFetch(`/rooms/floors/${id}`, { method: 'DELETE' }),

  // Room Types
  getRoomTypes: () => apiFetch('/rooms/types'),
  createRoomType: (body: {
    name: string;
    maxOccupancy: number;
    baseOccupancy?: number;
    baseRate: number;
    pricingUnit: string;
    description?: string;
    maxExtraBeds?: number;
    extraBedCharge?: number;
  }) => apiFetch('/rooms/types', { method: 'POST', body: JSON.stringify(body) }),
  updateRoomType: (id: string, body: {
    name: string;
    maxOccupancy: number;
    baseOccupancy?: number;
    baseRate: number;
    pricingUnit: string;
    description?: string;
    maxExtraBeds?: number;
    extraBedCharge?: number;
  }) => apiFetch(`/rooms/types/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteRoomType: (id: string) => apiFetch(`/rooms/types/${id}`, { method: 'DELETE' }),

  // Rooms
  getRooms: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return apiFetch(`/rooms${query}`);
  },
  createRoom: (body: { roomNumber: string; floorId: string; roomTypeId: string; status?: string; baseRate?: number }) =>
    apiFetch('/rooms', { method: 'POST', body: JSON.stringify(body) }),
  updateRoom: (id: string, body: {
    roomNumber?: string;
    floorId?: string;
    roomTypeId?: string;
    status?: string;
    rateOverride?: number | null;
  }) => apiFetch(`/rooms/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteRoom: (id: string) => apiFetch(`/rooms/${id}`, { method: 'DELETE' }),
  // PATCH /:id/status — uses canonical status list: available, occupied, blocked, maintenance, dirty, cleaning
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
  update: (id: string, body: any) => apiFetch(`/guests/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
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
// Backend routes: GET /:bookingId/folio, POST /charge, DELETE /charge/:id, PATCH /charge/:id, POST /payment, GET /invoices
export const billingApi = {
  getInvoices: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return apiFetch(`/billing/invoices${query}`);
  },
  getInvoice: (id: string) => apiFetch(`/billing/invoices/${id}`),
  getFolio: (bookingId: string) => apiFetch(`/billing/${bookingId}/folio`),
  addCharge: (body: any) =>
    apiFetch('/billing/charge', { method: 'POST', body: JSON.stringify(body) }),
  deleteCharge: (chargeId: string) =>
    apiFetch(`/billing/charge/${chargeId}`, { method: 'DELETE' }),
  updateCharge: (chargeId: string, body: { description?: string; unitPrice?: number; quantity?: number; category?: string; chargeDate?: string }) =>
    apiFetch(`/billing/charge/${chargeId}`, { method: 'PATCH', body: JSON.stringify(body) }),
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
  // Enriched single-call endpoint (v2): all KPIs, today panel, top room types
  getOverviewV2: (params?: { from?: string; to?: string }) => {
    const query = params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : '';
    return apiFetch(`/analytics/overview-v2${query}`);
  },
  // Convenience: fetch all three in parallel (legacy — used by old analytics page)
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

/**
 * Server-side fetch for the property page. Used in Server Components only.
 * `apiFetch` always sends `cache: 'no-store'` (because it carries auth tokens
 * we never want shared), which would mark the consuming route as dynamic and
 * defeat the page-level `revalidate`. This bypasses that, tags the fetch so
 * the on-demand revalidate route can target it precisely, and still works
 * fine because `/public/properties/:slug` requires no auth.
 */
async function publicFetchProperty(slug: string): Promise<any> {
  const res = await fetch(`${API_URL}/public/properties/${slug}`, {
    next: { revalidate: 60, tags: [`property:${slug}`] },
  });
  if (!res.ok) {
    return { success: false, error: `API error: ${res.status}` };
  }
  return res.json();
}

// Public helpers (no auth needed)
export const publicApi = {
  getPlans: () => apiFetch('/public/plans'),
  properties: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return apiFetch(`/public/properties${query}`);
  },
  property: (slug: string) => publicFetchProperty(slug),
  getAvailabilityHints: (slug: string) => apiFetch(`/public/properties/${slug}/availability-hints`),
  /**
   * Server-side fetch with the same ISR-friendly options as `property` —
   * tagged so the website-builder save can invalidate it alongside the
   * property data without a separate code path.
   */
  getRateComparison: async (slug: string) => {
    try {
      const res = await fetch(`${API_URL}/public/properties/${slug}/rate-comparison`, {
        next: { revalidate: 60, tags: [`property:${slug}`] },
      });
      if (!res.ok) return { success: false, data: null };
      return res.json();
    } catch {
      return { success: false, data: null };
    }
  },
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
  getTenantDetail: (tenantId: string) => apiFetch(`/platform/tenants/${tenantId}/detail`),
  updateTenantPlan: async (tenantId: string, plan: string) => {
    const res = await apiFetch(`/platform/tenants/${tenantId}/plan`, { method: 'PATCH', body: JSON.stringify({ plan }) });
    // Detail page shows the plan badge; the tenants list shows it as a column;
    // revenue rows are plan-derived. All three need a refresh.
    await invalidateAfterWrite(`/platform/tenants/${tenantId}/detail`);
    await invalidateAfterWrite('/platform/tenants', { prefix: true });
    await invalidateAfterWrite('/platform/revenue', { prefix: true });
    return res;
  },
  // Plan Config
  getPlans: () => apiFetch('/platform/plans'),
  updatePlan: (id: string, data: any) =>
    apiFetch(`/platform/plans/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  updatePlansBulk: (plans: any[]) =>
    apiFetch('/platform/plans-bulk', { method: 'PUT', body: JSON.stringify({ plans }) }),
  // Per-tenant custom pricing
  getTenantCustomPricing: (tenantId: string) => apiFetch(`/platform/tenants/${tenantId}/custom-pricing`),
  updateTenantCustomPricing: async (tenantId: string, customPlanPricing: any) => {
    const res = await apiFetch(`/platform/tenants/${tenantId}/custom-pricing`, { method: 'PUT', body: JSON.stringify({ customPlanPricing }) });
    await invalidateAfterWrite(`/platform/tenants/${tenantId}/custom-pricing`);
    await invalidateAfterWrite(`/platform/tenants/${tenantId}/detail`);
    await invalidateAfterWrite('/platform/revenue', { prefix: true });
    return res;
  },
  // GST Slabs
  getGstSlabs: () => apiFetch('/platform/gst-slabs'),
  updateGstSlabs: (slabs: any[]) =>
    apiFetch('/platform/gst-slabs', { method: 'PUT', body: JSON.stringify({ slabs }) }),
  resetGstSlabs: () =>
    apiFetch('/platform/gst-slabs/reset', { method: 'POST' }),
  // Revenue & Subscriptions
  getRevenue: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return apiFetch(`/platform/revenue${query}`);
  },
  // Campaign reference code analytics
  getReferenceStats: () => apiFetch('/platform/reference-stats'),
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

// Night Audit helpers
export const nightAuditApi = {
  getSummary: (dateStr?: string) => apiFetch(`/night-audit/summary${dateStr ? `?date=${dateStr}` : ''}`),
  getHistory: () => apiFetch('/night-audit/history'),
  runAudit: (targetDate?: string) => apiFetch('/night-audit/run', { method: 'POST', body: JSON.stringify({ targetDate }) }),
};

// Compliance helpers
export const complianceApi = {
  getGuestRegister: (startDate?: string, endDate?: string) => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    return apiFetch(`/compliance/guest-register?${params.toString()}`);
  },
  submitPoliceRegister: (date?: string) => 
    apiFetch('/compliance/police/submit', { method: 'POST', body: JSON.stringify({ date }) }),
  submitCForm: (guestId: string) => 
    apiFetch('/compliance/c-form/submit', { method: 'POST', body: JSON.stringify({ guestId }) }),
};
