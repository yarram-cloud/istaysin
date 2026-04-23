import { test, expect } from '@playwright/test';

test.describe('Form-C & FRRO Export Compliance', () => {
  let adminToken: string;
  let tenantId: string;
  let bookingId: string;

  test.beforeEach(async ({ request }) => {
    // Authenticate Admin
    const adminRes = await request.post('/api/v1/auth/login', {
      data: { identifier: 'owner-premium@e2e.com', password: 'Welcome@1' }
    });
    adminToken = (await adminRes.json()).data.accessToken;

    // Fetch Property metrics
    const propRes = await request.get('/api/v1/public/properties/premium-resort-pro');
    const property = await propRes.json();
    tenantId = property.data.id;
    
    // Switch tenant context
    await request.post('/api/v1/tenants/switch', {
      headers: { 'Authorization': `Bearer ${adminToken}` },
      data: { tenantId }
    });
  });

  test('Generates Foreign National C-Form export and verifies Compliance Register', async ({ page, request }) => {
    const roomTypeId = (await (await request.get(`/api/v1/public/properties/premium-resort-pro`)).json()).data.roomTypes[0].id;
    const dateToday = new Date().toISOString().split('T')[0];
    const dateTomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

    // 1. Create a Booking
    const bkgRes = await request.post('/api/v1/public/bookings', {
      data: {
        tenantId,
        guestName: 'John Doe',
        guestEmail: 'john.foreign@frro.com',
        guestPhone: '5552227777',
        checkInDate: dateToday,
        checkOutDate: dateTomorrow,
        numAdults: 1,
        numChildren: 0,
        roomSelections: [{ roomTypeId }]
      }
    });
    const booking = await bkgRes.json();
    bookingId = booking.data.id;

    // 2. Add guest as a foreign national
    await request.post(`/api/v1/bookings/${bookingId}/guests`, {
      headers: { 'Authorization': `Bearer ${adminToken}` },
      data: {
        fullName: 'John Doe',
        nationality: 'American',
        idProofNumber: 'US-PASS-998877',
        visaNumber: 'V-112233',
        visaExpiryDate: new Date(Date.now() + 86400000 * 30).toISOString(),
        purposeOfVisit: 'Tourism',
        arrivingFrom: 'New York',
        goingTo: 'Tokyo'
      }
    });

    // 3. UI LOGIN & NAVIGATION
    await page.goto('/login');
    await page.fill('input[type="email"]', 'owner-premium@e2e.com');
    await page.fill('input[type="password"]', 'Welcome@1');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');

    // Go to Police Register
    await page.goto('/dashboard/compliance/register');
    await expect(page.locator('h1', { hasText: 'Police Master Register' })).toBeVisible();

    // The guest 'John Doe' should be listed in the table
    await expect(page.locator('table >> text=John Doe').first()).toBeVisible();
    await expect(page.locator('table >> text=American').first()).toBeVisible();

    // Verify Email to SHO button works
    await page.click('button:has-text("Email to SHO")');
    await expect(page.locator('text=Successfully submitted to Station House Officer!')).toBeVisible();

    // Go to Bookings Details panel
    await page.goto('/dashboard/bookings');
    await page.click('table >> text=John Doe');

    // Look for FRRO panel and submit button
    await expect(page.locator('h3:has-text("FRRO & Police Compliance")')).toBeVisible();
    await page.click('button:has-text("Submit to FRRO")');
    await expect(page.locator('text=Successfully submitted C-Form to FRRO!')).toBeVisible();
    await expect(page.locator('text=FRRO Submitted')).toBeVisible();

  });
});
