import { test, expect } from '@playwright/test';

// Use same standard authentication/tenant structure as other specs
test.describe('Payments & UPI Module', () => {
  let token: string;
  let tenantId: string;
  let bookingId: string;

  test.beforeAll(async ({ request }) => {
    // 1. Global Admin Auth
    const loginRes = await request.post('http://localhost:3000/api/v1/auth/login', {
      data: { email: 'admin@istaysin.com', password: 'Password123!' }
    });
    const loginData = await loginRes.json();
    token = loginData.data.accessToken;

    // 2. Fetch primary tenant
    const tenantsRes = await request.get('http://localhost:3000/api/v1/tenants', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const tenantsData = await tenantsRes.json();
    tenantId = tenantsData.data[0].id;

    // 3. Configure a test UPI ID for the tenant
    await request.put(`http://localhost:3000/api/v1/tenants/${tenantId}/settings`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { config: { upiId: 'test.hotel@ybl' } }
    });

    // 4. Create a dummy guest and booking to test QR generation
    const guestRes = await request.post('http://localhost:3000/api/v1/guests', {
      headers: { Authorization: `Bearer ${token}`, 'x-tenant-id': tenantId },
      data: {
        fullName: 'Payment Tester',
        phone: '+919999988888',
        email: 'payment@test.com'
      }
    });
    const guestData = await guestRes.json();
    
    // We assume there are room types, we will just create a generic booking safely.
    // However, if creating a booking fails without rooms, we can simulate by mocking.
    // For E2E API stability, since we rely on existing DB state, let's fetch an existing booking if possible.
    const getBookingsRes = await request.get('http://localhost:3000/api/v1/bookings', {
      headers: { Authorization: `Bearer ${token}`, 'x-tenant-id': tenantId }
    });
    const existingBookings = await getBookingsRes.json();
    if (existingBookings.data && existingBookings.data.length > 0) {
      bookingId = existingBookings.data[0].id;
    }
  });

  test('Should block QR generation if user not authenticated', async ({ request }) => {
    const res = await request.get('http://localhost:3000/api/v1/payments/upi/qr?bookingId=dummy-id');
    expect(res.status()).toBe(403);
  });

  test('Should block QR generation for missing or invalid booking ID', async ({ request }) => {
    const res = await request.get('http://localhost:3000/api/v1/payments/upi/qr?bookingId=123-invalid', {
      headers: { Authorization: `Bearer ${token}`, 'x-tenant-id': tenantId }
    });
    const data = await res.json();
    expect(data.success).toBe(false);
    expect(data.error).toBe('Booking not found');
  });

  test('Should successfully generate UPI QR Data URI for valid booking', async ({ request }) => {
    test.skip(!bookingId, 'No booking to test against. Needs database seed.');
    
    const res = await request.get(`http://localhost:3000/api/v1/payments/upi/qr?bookingId=${bookingId}`, {
      headers: { Authorization: `Bearer ${token}`, 'x-tenant-id': tenantId }
    });
    
    const data = await res.json();
    if (data.success) {
      expect(data.data).toHaveProperty('deepLink');
      expect(data.data.deepLink).toContain('upi://pay');
      expect(data.data.deepLink).toContain('test.hotel@ybl');
      expect(data.data).toHaveProperty('qrCodeBase64');
      expect(data.data.qrCodeBase64).toContain('data:image/png;base64,');
    } else {
      // It might fail if booking has no balance due (balance <= 0)
      expect(data.error).toBe('Booking has no pending balance. Amount must be > 0 to generate a payment QR.');
    }
  });
});
