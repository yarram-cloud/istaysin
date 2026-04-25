import { test, expect } from '@playwright/test';

test.describe('Form-C & FRRO Export Compliance', () => {
  let adminToken: string;
  let tenantId: string;
  let bookingId: string;

  test.beforeEach(async ({ request }) => {
    // Authenticate as property owner
    const adminRes = await request.post('/api/v1/auth/login', {
      data: { identifier: 'owner-premium@e2e.com', password: 'Welcome@1' }
    });
    adminToken = (await adminRes.json()).data.accessToken;

    // Fetch property to get tenant ID
    const propRes = await request.get('/api/v1/public/properties/premium-resort-pro');
    const property = await propRes.json();
    tenantId = property.data.id;

    // Ensure police station email is configured so "Email to SHO" won't 400
    await request.patch(`/api/v1/tenants/${tenantId}/settings`, {
      headers: { 'Authorization': `Bearer ${adminToken}`, 'x-tenant-id': tenantId },
      data: { config: { policeStationEmail: 'sho@e2e-test.police.gov.in' } }
    });

    const roomTypeId = property.data.roomTypes[0].id;
    const dateToday = new Date().toISOString().split('T')[0];
    const dateTomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

    // Create booking
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

    // Confirm the booking so it appears in the compliance register
    // (register filters for confirmed/checked_in/checked_out only)
    await request.patch(`/api/v1/bookings/${bookingId}/confirm`, {
      headers: { 'Authorization': `Bearer ${adminToken}`, 'x-tenant-id': tenantId }
    });

    // Add foreign guest with idProofType so field renders correctly
    await request.post(`/api/v1/bookings/${bookingId}/guests`, {
      headers: { 'Authorization': `Bearer ${adminToken}`, 'x-tenant-id': tenantId },
      data: {
        fullName: 'John Doe',
        nationality: 'American',
        idProofType: 'passport',
        idProofNumber: 'US-PASS-998877',
        visaNumber: 'V-112233',
        visaExpiryDate: new Date(Date.now() + 86400000 * 30).toISOString(),
        purposeOfVisit: 'Tourism',
        arrivingFrom: 'New York',
        goingTo: 'Tokyo'
      }
    });
  });

  test('Generates Foreign National C-Form export and verifies Compliance Register', async ({ page }) => {
    // Log in via UI
    await page.goto('/login');
    await page.fill('input[type="email"]', 'owner-premium@e2e.com');
    await page.fill('input[type="password"]', 'Welcome@1');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');

    // Navigate to Police Register
    await page.goto('/dashboard/compliance/register');
    await expect(page.locator('h1', { hasText: 'Police Master Register' })).toBeVisible();

    // Foreign guest should appear in the table
    await expect(page.locator('table >> text=John Doe').first()).toBeVisible();
    await expect(page.locator('table >> text=American').first()).toBeVisible();

    // Email to SHO should succeed
    await page.click('button:has-text("Email to SHO")');
    await expect(page.locator('text=Successfully submitted to Station House Officer!')).toBeVisible();

    // Navigate to bookings and open the booking row
    await page.goto('/dashboard/bookings');
    await page.click('table >> text=John Doe');

    // FRRO section should be visible with correct heading and button text
    await expect(page.locator('h3:has-text("FRRO & Police Compliance")')).toBeVisible();
    await page.click('button:has-text("Submit to FRRO")');
    await expect(page.locator('text=Successfully submitted C-Form to FRRO!')).toBeVisible();
    await expect(page.locator('text=FRRO Submitted')).toBeVisible();
  });
});
