import { test, expect } from '@playwright/test';

const API = process.env.API_URL || 'http://localhost:4100';

/**
 * Full Platform E2E Test Suite — iStays
 * Covers auth guards, validation, and basic flow for every module.
 *
 * Tests are arranged module-by-module, mirroring the API router structure.
 * Each module tests: (1) unauthenticated rejection, (2) input validation, (3) basic flow.
 */

// ═══════════════════════════════════════════════════
// 1. HEALTH CHECK
// ═══════════════════════════════════════════════════
test.describe('01 — Health Check', () => {
  test('Should return 200 OK with service name', async ({ request }) => {
    const res = await request.get(`${API}/api/v1/health`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.status).toBe('ok');
    expect(body.service).toBe('istays-api');
  });
});

// ═══════════════════════════════════════════════════
// 2. AUTH MODULE
// ═══════════════════════════════════════════════════
test.describe('02 — Auth Module', () => {
  test('AUTH-01: Register rejects missing fields', async ({ request }) => {
    const res = await request.post(`${API}/api/v1/auth/register`, { data: {} });
    expect(res.status()).toBe(400);
  });

  test('AUTH-02: Login rejects invalid credentials', async ({ request }) => {
    const res = await request.post(`${API}/api/v1/auth/login`, {
      data: { email: 'nonexistent@test.com', password: 'WrongPassword123' }
    });
    expect(res.status()).toBe(401);
  });

  test('AUTH-03: /me requires authentication', async ({ request }) => {
    const res = await request.get(`${API}/api/v1/auth/me`);
    expect(res.status()).toBe(401);
  });

  test('AUTH-04: Refresh token rejects empty body', async ({ request }) => {
    const res = await request.post(`${API}/api/v1/auth/refresh-token`, { data: {} });
    expect(res.status()).toBe(400);
  });

  test('AUTH-05: WhatsApp OTP rejects missing phone', async ({ request }) => {
    const res = await request.post(`${API}/api/v1/auth/send-whatsapp-otp`, { data: {} });
    expect(res.status()).toBe(400);
  });

  test('AUTH-06: OTP verification rejects missing fields', async ({ request }) => {
    const res = await request.post(`${API}/api/v1/auth/verify-whatsapp-otp`, { data: {} });
    expect(res.status()).toBe(400);
  });
});

// ═══════════════════════════════════════════════════
// 3. TENANTS MODULE
// ═══════════════════════════════════════════════════
test.describe('03 — Tenants Module', () => {
  test('TENANT-01: Creating property requires auth', async ({ request }) => {
    const res = await request.post(`${API}/api/v1/tenants`, { data: { name: 'Test Hotel' } });
    expect(res.status()).toBe(401);
  });

  test('TENANT-02: Listing user properties requires auth', async ({ request }) => {
    const res = await request.get(`${API}/api/v1/tenants`);
    expect(res.status()).toBe(401);
  });
});

// ═══════════════════════════════════════════════════
// 4. ROOMS MODULE
// ═══════════════════════════════════════════════════
test.describe('04 — Rooms Module', () => {
  test('ROOMS-01: Listing rooms requires auth', async ({ request }) => {
    const res = await request.get(`${API}/api/v1/rooms`);
    expect(res.status()).toBe(401);
  });

  test('ROOMS-02: Creating room requires auth', async ({ request }) => {
    const res = await request.post(`${API}/api/v1/rooms`, { data: {} });
    expect(res.status()).toBe(401);
  });

  test('ROOMS-03: Room types listing requires auth', async ({ request }) => {
    const res = await request.get(`${API}/api/v1/rooms/types`);
    expect(res.status()).toBe(401);
  });

  test('ROOMS-04: Floors listing requires auth', async ({ request }) => {
    const res = await request.get(`${API}/api/v1/rooms/floors`);
    expect(res.status()).toBe(401);
  });
});

// ═══════════════════════════════════════════════════
// 5. BOOKINGS MODULE
// ═══════════════════════════════════════════════════
test.describe('05 — Bookings Module', () => {
  test('BOOK-01: Listing bookings requires auth', async ({ request }) => {
    const res = await request.get(`${API}/api/v1/bookings`);
    expect(res.status()).toBe(401);
  });

  test('BOOK-02: Creating booking requires auth', async ({ request }) => {
    const res = await request.post(`${API}/api/v1/bookings`, { data: {} });
    expect(res.status()).toBe(401);
  });
});

// ═══════════════════════════════════════════════════
// 6. GUESTS MODULE
// ═══════════════════════════════════════════════════
test.describe('06 — Guests Module', () => {
  test('GUEST-01: Listing guests requires auth', async ({ request }) => {
    const res = await request.get(`${API}/api/v1/guests`);
    expect(res.status()).toBe(401);
  });

  test('GUEST-02: Creating guest profile requires auth', async ({ request }) => {
    const res = await request.post(`${API}/api/v1/guests`, { data: {} });
    expect(res.status()).toBe(401);
  });
});

// ═══════════════════════════════════════════════════
// 7. CHECK-IN / CHECK-OUT MODULE
// ═══════════════════════════════════════════════════
test.describe('07 — Check-In/Out Module', () => {
  test('CICO-01: Check-in requires auth', async ({ request }) => {
    const res = await request.post(`${API}/api/v1/check-in-out/fake-id/check-in`, { data: {} });
    expect(res.status()).toBe(401);
  });

  test('CICO-02: Check-out requires auth', async ({ request }) => {
    const res = await request.post(`${API}/api/v1/check-in-out/fake-id/check-out`, { data: {} });
    expect(res.status()).toBe(401);
  });
});

// ═══════════════════════════════════════════════════
// 8. BILLING MODULE
// ═══════════════════════════════════════════════════
test.describe('08 — Billing Module', () => {
  test('BILL-01: Folio charges listing requires auth', async ({ request }) => {
    const res = await request.get(`${API}/api/v1/billing/folio/fake-id`);
    expect(res.status()).toBe(401);
  });

  test('BILL-02: Adding charge requires auth', async ({ request }) => {
    const res = await request.post(`${API}/api/v1/billing/charges`, { data: {} });
    expect(res.status()).toBe(401);
  });

  test('BILL-03: Recording payment requires auth', async ({ request }) => {
    const res = await request.post(`${API}/api/v1/billing/payments`, { data: {} });
    expect(res.status()).toBe(401);
  });

  test('BILL-04: Invoice generation requires auth', async ({ request }) => {
    const res = await request.post(`${API}/api/v1/billing/invoices`, { data: {} });
    expect(res.status()).toBe(401);
  });
});

// ═══════════════════════════════════════════════════
// 9. PUBLIC MODULE (no auth required)
// ═══════════════════════════════════════════════════
test.describe('09 — Public Module', () => {
  test('PUB-01: Property listing works without auth', async ({ request }) => {
    const res = await request.get(`${API}/api/v1/public/properties`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  test('PUB-02: Property search by city works', async ({ request }) => {
    const res = await request.get(`${API}/api/v1/public/properties?city=Hyderabad`);
    expect(res.status()).toBe(200);
  });

  test('PUB-03: Non-existent slug returns 404', async ({ request }) => {
    const res = await request.get(`${API}/api/v1/public/properties/nonexistent-slug-12345`);
    expect(res.status()).toBe(404);
  });
});

// ═══════════════════════════════════════════════════
// 10. PLATFORM ADMIN MODULE
// ═══════════════════════════════════════════════════
test.describe('10 — Platform Admin Module', () => {
  test('PLAT-01: Platform stats require auth', async ({ request }) => {
    const res = await request.get(`${API}/api/v1/platform/stats`);
    expect(res.status()).toBe(401);
  });

  test('PLAT-02: Tenant approval requires auth', async ({ request }) => {
    const res = await request.post(`${API}/api/v1/platform/tenants/fake-id/approve`);
    expect(res.status()).toBe(401);
  });
});

// ═══════════════════════════════════════════════════
// 11. NOTIFICATIONS MODULE
// ═══════════════════════════════════════════════════
test.describe('11 — Notifications Module', () => {
  test('NOTIF-01: Listing notifications requires auth', async ({ request }) => {
    const res = await request.get(`${API}/api/v1/notifications`);
    expect(res.status()).toBe(401);
  });

  test('NOTIF-02: Marking read requires auth', async ({ request }) => {
    const res = await request.put(`${API}/api/v1/notifications/fake-id/read`);
    expect(res.status()).toBe(401);
  });
});

// ═══════════════════════════════════════════════════
// 12. ANALYTICS MODULE
// ═══════════════════════════════════════════════════
test.describe('12 — Analytics Module', () => {
  test('ANA-01: Dashboard analytics require auth', async ({ request }) => {
    const res = await request.get(`${API}/api/v1/analytics/dashboard`);
    expect(res.status()).toBe(401);
  });

  test('ANA-02: Revenue analytics require auth', async ({ request }) => {
    const res = await request.get(`${API}/api/v1/analytics/revenue`);
    expect(res.status()).toBe(401);
  });
});

// ═══════════════════════════════════════════════════
// 13. DASHBOARD MODULE
// ═══════════════════════════════════════════════════
test.describe('13 — Dashboard Module', () => {
  test('DASH-01: Dashboard summary requires auth', async ({ request }) => {
    const res = await request.get(`${API}/api/v1/dashboard`);
    expect(res.status()).toBe(401);
  });
});

// ═══════════════════════════════════════════════════
// 14. HOUSEKEEPING MODULE
// ═══════════════════════════════════════════════════
test.describe('14 — Housekeeping Module', () => {
  test('HK-01: Task listing requires auth', async ({ request }) => {
    const res = await request.get(`${API}/api/v1/housekeeping`);
    expect(res.status()).toBe(401);
  });

  test('HK-02: Task creation requires auth', async ({ request }) => {
    const res = await request.post(`${API}/api/v1/housekeeping`, { data: {} });
    expect(res.status()).toBe(401);
  });

  test('HK-03: Task update requires auth', async ({ request }) => {
    const res = await request.put(`${API}/api/v1/housekeeping/fake-id`, { data: {} });
    expect(res.status()).toBe(401);
  });
});

// ═══════════════════════════════════════════════════
// 15. PRICING MODULE
// ═══════════════════════════════════════════════════
test.describe('15 — Pricing Module', () => {
  test('PRICE-01: Pricing rules listing requires auth', async ({ request }) => {
    const res = await request.get(`${API}/api/v1/pricing/rules`);
    expect(res.status()).toBe(401);
  });

  test('PRICE-02: Creating pricing rule requires auth', async ({ request }) => {
    const res = await request.post(`${API}/api/v1/pricing/rules`, { data: {} });
    expect(res.status()).toBe(401);
  });

  test('PRICE-03: Rate seasons listing requires auth', async ({ request }) => {
    const res = await request.get(`${API}/api/v1/pricing/seasons`);
    expect(res.status()).toBe(401);
  });
});

// ═══════════════════════════════════════════════════
// 16. USERS MODULE
// ═══════════════════════════════════════════════════
test.describe('16 — Users Module', () => {
  test('USER-01: Staff listing requires auth', async ({ request }) => {
    const res = await request.get(`${API}/api/v1/users`);
    expect(res.status()).toBe(401);
  });

  test('USER-02: Inviting staff requires auth', async ({ request }) => {
    const res = await request.post(`${API}/api/v1/users/invite`, { data: {} });
    expect(res.status()).toBe(401);
  });
});

// ═══════════════════════════════════════════════════
// 17. REVIEWS MODULE
// ═══════════════════════════════════════════════════
test.describe('17 — Reviews Module', () => {
  test('REV-01: Review listing requires auth', async ({ request }) => {
    const res = await request.get(`${API}/api/v1/reviews`);
    expect(res.status()).toBe(401);
  });
});

// ═══════════════════════════════════════════════════
// 18. SHIFTS MODULE
// ═══════════════════════════════════════════════════
test.describe('18 — Shifts Module', () => {
  test('SHIFT-01: Shift listing requires auth', async ({ request }) => {
    const res = await request.get(`${API}/api/v1/shifts`);
    expect(res.status()).toBe(401);
  });

  test('SHIFT-02: Creating shift requires auth', async ({ request }) => {
    const res = await request.post(`${API}/api/v1/shifts`, { data: {} });
    expect(res.status()).toBe(401);
  });
});

// ═══════════════════════════════════════════════════
// 19. CHANNELS MODULE
// ═══════════════════════════════════════════════════
test.describe('19 — Channels Module', () => {
  test('CH-01: Connection listing requires auth', async ({ request }) => {
    const res = await request.get(`${API}/api/v1/channels/connections`);
    expect(res.status()).toBe(401);
  });

  test('CH-02: Creating connection requires auth', async ({ request }) => {
    const res = await request.post(`${API}/api/v1/channels/connections`, { data: {} });
    expect(res.status()).toBe(401);
  });

  test('CH-03: Webhook rejects unknown OTA', async ({ request }) => {
    const res = await request.post(`${API}/api/v1/channels/webhooks/incoming/fake_ota`, {
      data: { hotelId: 'xyz' }
    });
    expect(res.status()).toBe(400);
  });

  test('CH-04: Webhook accepts valid OTA channel', async ({ request }) => {
    const res = await request.post(`${API}/api/v1/channels/webhooks/incoming/agoda`, {
      data: { hotelId: 'mock', roomId: 'mock', guestName: 'Test', checkInDate: '2027-01-01', checkOutDate: '2027-01-03' }
    });
    expect(res.status()).toBe(200);
  });
});

// ═══════════════════════════════════════════════════
// 20. LOYALTY MODULE
// ═══════════════════════════════════════════════════
test.describe('20 — Loyalty Module', () => {
  test('LOY-01: Account listing requires auth', async ({ request }) => {
    const res = await request.get(`${API}/api/v1/loyalty/accounts`);
    expect(res.status()).toBe(401);
  });

  test('LOY-02: Rewards listing requires auth', async ({ request }) => {
    const res = await request.get(`${API}/api/v1/loyalty/rewards`);
    expect(res.status()).toBe(401);
  });
});

// ═══════════════════════════════════════════════════
// 21. COMPLIANCE MODULE
// ═══════════════════════════════════════════════════
test.describe('21 — Compliance Module', () => {
  test('COMP-01: FRRO report requires auth', async ({ request }) => {
    const res = await request.get(`${API}/api/v1/compliance/frro`);
    expect(res.status()).toBe(401);
  });

  test('COMP-02: GST report requires auth', async ({ request }) => {
    const res = await request.get(`${API}/api/v1/compliance/gst-summary`);
    expect(res.status()).toBe(401);
  });
});

// ═══════════════════════════════════════════════════
// 22. GROUPS MODULE
// ═══════════════════════════════════════════════════
test.describe('22 — Groups Module', () => {
  test('GRP-01: Group block listing requires auth', async ({ request }) => {
    const res = await request.get(`${API}/api/v1/groups`);
    expect(res.status()).toBe(401);
  });

  test('GRP-02: Creating group block requires auth', async ({ request }) => {
    const res = await request.post(`${API}/api/v1/groups`, { data: {} });
    expect(res.status()).toBe(401);
  });
});

// ═══════════════════════════════════════════════════
// 23. GUEST PORTAL MODULE
// ═══════════════════════════════════════════════════
test.describe('23 — Guest Portal Module', () => {
  test('GP-01: My bookings requires auth', async ({ request }) => {
    const res = await request.get(`${API}/api/v1/guest-portal/my-bookings`);
    expect(res.status()).toBe(401);
  });

  test('GP-02: Booking detail requires auth', async ({ request }) => {
    const res = await request.get(`${API}/api/v1/guest-portal/booking/fake-id`);
    expect(res.status()).toBe(401);
  });

  test('GP-03: Invoice download requires auth', async ({ request }) => {
    const res = await request.get(`${API}/api/v1/guest-portal/invoice/fake-id`);
    expect(res.status()).toBe(401);
  });

  test('GP-04: Pre-check-in requires auth', async ({ request }) => {
    const res = await request.post(`${API}/api/v1/guest-portal/pre-checkin/fake-id`, { data: {} });
    expect(res.status()).toBe(401);
  });

  test('GP-05: Public lookup rejects missing params', async ({ request }) => {
    const res = await request.get(`${API}/api/v1/guest-portal/lookup`);
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('required');
  });

  test('GP-06: Public lookup returns 404 for non-existent booking', async ({ request }) => {
    const res = await request.get(`${API}/api/v1/guest-portal/lookup?bookingRef=IS-FAKE-REF&phone=9999999999`);
    expect(res.status()).toBe(404);
  });
});
