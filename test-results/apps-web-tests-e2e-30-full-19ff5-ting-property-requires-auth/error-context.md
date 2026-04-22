# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: apps\web\tests\e2e\30-full-platform.spec.ts >> 03 — Tenants Module >> TENANT-01: Creating property requires auth
- Location: apps\web\tests\e2e\30-full-platform.spec.ts:67:7

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: 401
Received: 404
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | 
  3   | const API = process.env.API_URL || 'http://localhost:4100';
  4   | 
  5   | /**
  6   |  * Full Platform E2E Test Suite — iStays
  7   |  * Covers auth guards, validation, and basic flow for every module.
  8   |  *
  9   |  * Tests are arranged module-by-module, mirroring the API router structure.
  10  |  * Each module tests: (1) unauthenticated rejection, (2) input validation, (3) basic flow.
  11  |  */
  12  | 
  13  | // ═══════════════════════════════════════════════════
  14  | // 1. HEALTH CHECK
  15  | // ═══════════════════════════════════════════════════
  16  | test.describe('01 — Health Check', () => {
  17  |   test('Should return 200 OK with service name', async ({ request }) => {
  18  |     const res = await request.get(`${API}/api/v1/health`);
  19  |     expect(res.status()).toBe(200);
  20  |     const body = await res.json();
  21  |     expect(body.status).toBe('ok');
  22  |     expect(body.service).toBe('istays-api');
  23  |   });
  24  | });
  25  | 
  26  | // ═══════════════════════════════════════════════════
  27  | // 2. AUTH MODULE
  28  | // ═══════════════════════════════════════════════════
  29  | test.describe('02 — Auth Module', () => {
  30  |   test('AUTH-01: Register rejects missing fields', async ({ request }) => {
  31  |     const res = await request.post(`${API}/api/v1/auth/register`, { data: {} });
  32  |     expect(res.status()).toBe(400);
  33  |   });
  34  | 
  35  |   test('AUTH-02: Login rejects invalid credentials', async ({ request }) => {
  36  |     const res = await request.post(`${API}/api/v1/auth/login`, {
  37  |       data: { email: 'nonexistent@test.com', password: 'WrongPassword123' }
  38  |     });
  39  |     expect(res.status()).toBe(401);
  40  |   });
  41  | 
  42  |   test('AUTH-03: /me requires authentication', async ({ request }) => {
  43  |     const res = await request.get(`${API}/api/v1/auth/me`);
  44  |     expect(res.status()).toBe(401);
  45  |   });
  46  | 
  47  |   test('AUTH-04: Refresh token rejects empty body', async ({ request }) => {
  48  |     const res = await request.post(`${API}/api/v1/auth/refresh-token`, { data: {} });
  49  |     expect(res.status()).toBe(400);
  50  |   });
  51  | 
  52  |   test('AUTH-05: WhatsApp OTP rejects missing phone', async ({ request }) => {
  53  |     const res = await request.post(`${API}/api/v1/auth/send-whatsapp-otp`, { data: {} });
  54  |     expect(res.status()).toBe(400);
  55  |   });
  56  | 
  57  |   test('AUTH-06: OTP verification rejects missing fields', async ({ request }) => {
  58  |     const res = await request.post(`${API}/api/v1/auth/verify-whatsapp-otp`, { data: {} });
  59  |     expect(res.status()).toBe(400);
  60  |   });
  61  | });
  62  | 
  63  | // ═══════════════════════════════════════════════════
  64  | // 3. TENANTS MODULE
  65  | // ═══════════════════════════════════════════════════
  66  | test.describe('03 — Tenants Module', () => {
  67  |   test('TENANT-01: Creating property requires auth', async ({ request }) => {
  68  |     const res = await request.post(`${API}/api/v1/tenants`, { data: { name: 'Test Hotel' } });
> 69  |     expect(res.status()).toBe(401);
      |                          ^ Error: expect(received).toBe(expected) // Object.is equality
  70  |   });
  71  | 
  72  |   test('TENANT-02: Listing user properties requires auth', async ({ request }) => {
  73  |     const res = await request.get(`${API}/api/v1/tenants`);
  74  |     expect(res.status()).toBe(401);
  75  |   });
  76  | });
  77  | 
  78  | // ═══════════════════════════════════════════════════
  79  | // 4. ROOMS MODULE
  80  | // ═══════════════════════════════════════════════════
  81  | test.describe('04 — Rooms Module', () => {
  82  |   test('ROOMS-01: Listing rooms requires auth', async ({ request }) => {
  83  |     const res = await request.get(`${API}/api/v1/rooms`);
  84  |     expect(res.status()).toBe(401);
  85  |   });
  86  | 
  87  |   test('ROOMS-02: Creating room requires auth', async ({ request }) => {
  88  |     const res = await request.post(`${API}/api/v1/rooms`, { data: {} });
  89  |     expect(res.status()).toBe(401);
  90  |   });
  91  | 
  92  |   test('ROOMS-03: Room types listing requires auth', async ({ request }) => {
  93  |     const res = await request.get(`${API}/api/v1/rooms/types`);
  94  |     expect(res.status()).toBe(401);
  95  |   });
  96  | 
  97  |   test('ROOMS-04: Floors listing requires auth', async ({ request }) => {
  98  |     const res = await request.get(`${API}/api/v1/rooms/floors`);
  99  |     expect(res.status()).toBe(401);
  100 |   });
  101 | });
  102 | 
  103 | // ═══════════════════════════════════════════════════
  104 | // 5. BOOKINGS MODULE
  105 | // ═══════════════════════════════════════════════════
  106 | test.describe('05 — Bookings Module', () => {
  107 |   test('BOOK-01: Listing bookings requires auth', async ({ request }) => {
  108 |     const res = await request.get(`${API}/api/v1/bookings`);
  109 |     expect(res.status()).toBe(401);
  110 |   });
  111 | 
  112 |   test('BOOK-02: Creating booking requires auth', async ({ request }) => {
  113 |     const res = await request.post(`${API}/api/v1/bookings`, { data: {} });
  114 |     expect(res.status()).toBe(401);
  115 |   });
  116 | });
  117 | 
  118 | // ═══════════════════════════════════════════════════
  119 | // 6. GUESTS MODULE
  120 | // ═══════════════════════════════════════════════════
  121 | test.describe('06 — Guests Module', () => {
  122 |   test('GUEST-01: Listing guests requires auth', async ({ request }) => {
  123 |     const res = await request.get(`${API}/api/v1/guests`);
  124 |     expect(res.status()).toBe(401);
  125 |   });
  126 | 
  127 |   test('GUEST-02: Creating guest profile requires auth', async ({ request }) => {
  128 |     const res = await request.post(`${API}/api/v1/guests`, { data: {} });
  129 |     expect(res.status()).toBe(401);
  130 |   });
  131 | });
  132 | 
  133 | // ═══════════════════════════════════════════════════
  134 | // 7. CHECK-IN / CHECK-OUT MODULE
  135 | // ═══════════════════════════════════════════════════
  136 | test.describe('07 — Check-In/Out Module', () => {
  137 |   test('CICO-01: Check-in requires auth', async ({ request }) => {
  138 |     const res = await request.post(`${API}/api/v1/check-in-out/fake-id/check-in`, { data: {} });
  139 |     expect(res.status()).toBe(401);
  140 |   });
  141 | 
  142 |   test('CICO-02: Check-out requires auth', async ({ request }) => {
  143 |     const res = await request.post(`${API}/api/v1/check-in-out/fake-id/check-out`, { data: {} });
  144 |     expect(res.status()).toBe(401);
  145 |   });
  146 | });
  147 | 
  148 | // ═══════════════════════════════════════════════════
  149 | // 8. BILLING MODULE
  150 | // ═══════════════════════════════════════════════════
  151 | test.describe('08 — Billing Module', () => {
  152 |   test('BILL-01: Folio charges listing requires auth', async ({ request }) => {
  153 |     const res = await request.get(`${API}/api/v1/billing/folio/fake-id`);
  154 |     expect(res.status()).toBe(401);
  155 |   });
  156 | 
  157 |   test('BILL-02: Adding charge requires auth', async ({ request }) => {
  158 |     const res = await request.post(`${API}/api/v1/billing/charges`, { data: {} });
  159 |     expect(res.status()).toBe(401);
  160 |   });
  161 | 
  162 |   test('BILL-03: Recording payment requires auth', async ({ request }) => {
  163 |     const res = await request.post(`${API}/api/v1/billing/payments`, { data: {} });
  164 |     expect(res.status()).toBe(401);
  165 |   });
  166 | 
  167 |   test('BILL-04: Invoice generation requires auth', async ({ request }) => {
  168 |     const res = await request.post(`${API}/api/v1/billing/invoices`, { data: {} });
  169 |     expect(res.status()).toBe(401);
```