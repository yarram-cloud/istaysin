import { test, expect } from '@playwright/test';
import { LoginPage } from '../pom/login.page';
import { FrontdeskPage } from '../pom/frontdesk.page';

test.describe('Billing & Folios Operations', () => {
  let loginPage: LoginPage;
  let frontdeskPage: FrontdeskPage;
  let testBookingId: string;
  let testBookingNumber: string;

  test.beforeEach(async ({ page, request }) => {
    loginPage = new LoginPage(page);
    frontdeskPage = new FrontdeskPage(page);

    await loginPage.goto();
    await loginPage.login('owner-premium@e2e.com', 'Welcome@1');

    // Fetch property and generate a dummy booking
    const propRes = await request.get('/api/v1/public/properties/premium-resort-pro');
    const property = await propRes.json();
    const roomTypeId = property.data.roomTypes[0].id;
    const roomId = property.data.roomTypes[0].rooms[0].id;
    
    const tokenRes = await page.evaluate(() => localStorage.getItem('accessToken'));
    
    const bookingRes = await request.post('/api/v1/public/bookings', {
      data: {
        tenantId: property.data.id,
        guestName: 'E2E Folio Guest',
        guestPhone: '5551234567',
        checkInDate: new Date().toISOString().split('T')[0],
        checkOutDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        numAdults: 1,
        numChildren: 0,
        roomSelections: [{ roomTypeId }]
      }
    });

    const bookingData = await bookingRes.json();
    testBookingId = bookingData.data.booking.id;
    testBookingNumber = bookingData.data.booking.bookingNumber;

    // Manually force it to 'checked_in' status so we can check it out securely
    await request.patch(`/api/v1/bookings/${testBookingId}/status`, {
      headers: { 'Authorization': `Bearer ${tokenRes}` },
      data: { status: 'checked_in' }
    });
  });

  test('Dynamically inject folio charges and verify final Invoice reflects GST', async ({ page, request }) => {
    const tokenRes = await page.evaluate(() => localStorage.getItem('accessToken'));

    // Inject a ₹2000 Minibar charge with 18% generic GST natively via API
    const chargeRes = await request.post('/api/v1/billing/charge', {
      headers: { 'Authorization': `Bearer ${tokenRes}` },
      data: {
        bookingId: testBookingId,
        chargeDate: new Date().toISOString().split('T')[0],
        category: 'other', // SAC: 999799 (18%)
        description: 'Premium Minibar Consumption',
        unitPrice: 2000,
        quantity: 1
      }
    });

    expect(chargeRes.status()).toBe(201);
    
    // UI Validation
    await frontdeskPage.gotoBookings('premium-resort-pro');
    await frontdeskPage.openBookingDetails(testBookingNumber);

    // The backend balance should be increased by 2000 + 18% (360) = 2360 (plus base room rate)
    // We execute Check-Out to verify the UI pulls the total dynamically
    await frontdeskPage.checkoutBtn.click();
    await expect(frontdeskPage.checkOutModal).toBeVisible();

    // Verify the balance input value is > 2360 minimum (it contains room base rate + minibar + taxes)
    const rawBalance = await frontdeskPage.balanceDueInput.inputValue();
    expect(Number(rawBalance)).toBeGreaterThan(2360);

    // Provide the required total and Settle the folio
    await frontdeskPage.balanceDueInput.fill(rawBalance);
    await frontdeskPage.paymentCardRadio.click();
    
    // Lock in Checkout which generates the Invoice
    await frontdeskPage.completeCheckOutBtn.click();
    await expect(frontdeskPage.checkoutSuccessHeading).toBeVisible();

    // Secondary UI Validation: Navigate to Billing tab and verify the Invoice grand total matches
    await page.goto('http://localhost:3100/dashboard/billing');
    // Ensure the Table has a row containing our guest name
    const invoiceRow = page.locator('tr').filter({ hasText: 'E2E Folio Guest' }).first();
    await expect(invoiceRow).toBeVisible();
    
    // Validate the total matches the exact checked-out balance
    const expectedDisplayedTotal = `₹${Number(rawBalance).toLocaleString('en-IN')}`;
    await expect(invoiceRow).toContainText(expectedDisplayedTotal, { ignoreCase: true });
  });
});
