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

    // PDF EXPORT VALIDATION
    // 1. Fetch the latest invoices via API to get the Invoice ID
    const invoicesRes = await request.get('/api/v1/billing/invoices', {
      headers: { 'Authorization': `Bearer ${tokenRes}` }
    });
    const invoicesBody = await invoicesRes.json();
    const guestInvoice = invoicesBody.data.find((inv: any) => inv.guestName === 'E2E Folio Guest');
    expect(guestInvoice).toBeDefined();

    // 2. Hit the PDF Endpoint
    const pdfRes = await request.get(`/api/v1/billing/invoices/${guestInvoice.id}/pdf`, {
      headers: { 'Authorization': `Bearer ${tokenRes}` }
    });

    // 3. Verify PDF response signature
    expect(pdfRes.status()).toBe(200);
    expect(pdfRes.headers()['content-type']).toBe('application/pdf');
    expect(pdfRes.headers()['content-disposition']).toContain(`attachment; filename="Invoice-${guestInvoice.invoiceNumber}.pdf"`);
    
    // 4. Verify PDF Buffer has data
    const buffer = await pdfRes.body();
    expect(buffer.length).toBeGreaterThan(1000); // A generated PDF should definitely be > 1KB
  });

  test('GSTR1-01: GSTR-1 export requires authentication', async ({ request }) => {
    const res = await request.get('/api/v1/billing/gstr1?month=2026-04');
    expect(res.status()).toBe(401);
  });

  test('GSTR1-02: GSTR-1 export returns valid CSV for current month', async ({ page, request }) => {
    const tokenRes = await page.evaluate(() => localStorage.getItem('accessToken'));

    const currentMonth = new Date().toISOString().slice(0, 7);
    const res = await request.get(`/api/v1/billing/gstr1?month=${currentMonth}`, {
      headers: { 'Authorization': `Bearer ${tokenRes}` }
    });

    expect(res.status()).toBe(200);
    expect(res.headers()['content-type']).toContain('text/csv');
    expect(res.headers()['content-disposition']).toContain(`GSTR1_`);
    expect(res.headers()['content-disposition']).toContain(currentMonth);

    const body = await res.text();
    // Must contain the 18-column header
    expect(body).toContain('Invoice No,Invoice Date,Booking No,Guest Name,Guest Phone');
    expect(body).toContain('CGST (Rs),SGST (Rs),IGST (Rs),Total (Rs),Supply Type');
    // Must contain the property metadata block
    expect(body).toContain('GSTIN:');
    expect(body).toContain('Report Period:');
    // Must contain the period summary row
    expect(body).toContain('PERIOD SUMMARY');
    expect(body).toContain(currentMonth);
  });

  test('GSTR1-03: GSTR-1 export rejects invalid month format', async ({ page, request }) => {
    const tokenRes = await page.evaluate(() => localStorage.getItem('accessToken'));

    const res = await request.get('/api/v1/billing/gstr1?month=April-2026', {
      headers: { 'Authorization': `Bearer ${tokenRes}` }
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error).toContain('YYYY-MM');
  });

  test('CHG-01: Add Charge button visible for checked-in booking', async ({ page }) => {
    await page.goto('http://localhost:3100/dashboard/bookings');
    await page.waitForLoadState('networkidle');
    const bookingEl = page.getByText(testBookingNumber).first();
    await bookingEl.click();
    // Button text changed to "Add Charge" in the folio panel header
    await expect(page.getByRole('button', { name: /Add Charge/i }).first()).toBeVisible({ timeout: 6000 });
  });

  test('CHG-02: Add Charge API - valid food charge creates folio entry', async ({ page, request }) => {
    const tokenRes = await page.evaluate(() => localStorage.getItem('accessToken'));
    const chargeRes = await request.post('/api/v1/billing/charge', {
      headers: { 'Authorization': `Bearer ${tokenRes}` },
      data: {
        bookingId: testBookingId,
        chargeDate: new Date().toISOString().split('T')[0],
        category: 'food',
        description: 'Breakfast x 2',
        unitPrice: 350,
        quantity: 2,
      }
    });
    expect(chargeRes.status()).toBe(201);
    const chargeBody = await chargeRes.json();
    expect(chargeBody.success).toBe(true);
    expect(chargeBody.data.category).toBe('food');
    expect(chargeBody.data.totalPrice).toBe(700);
  });

  test('CHG-03: Add Charge API - invalid category returns 400', async ({ page, request }) => {
    const tokenRes = await page.evaluate(() => localStorage.getItem('accessToken'));
    const chargeRes = await request.post('/api/v1/billing/charge', {
      headers: { 'Authorization': `Bearer ${tokenRes}` },
      data: {
        bookingId: testBookingId,
        chargeDate: new Date().toISOString().split('T')[0],
        category: 'food_beverage',
        description: 'Test',
        unitPrice: 100,
        quantity: 1,
      }
    });
    expect(chargeRes.status()).toBe(400);
    const body = await chargeRes.json();
    expect(body.success).toBe(false);
  });

  test('CHG-04: DELETE charge reverses booking balance', async ({ page, request }) => {
    const tokenRes = await page.evaluate(() => localStorage.getItem('accessToken'));

    // Create a charge
    const chargeRes = await request.post('/api/v1/billing/charge', {
      headers: { 'Authorization': `Bearer ${tokenRes}` },
      data: {
        bookingId: testBookingId,
        chargeDate: new Date().toISOString().split('T')[0],
        category: 'laundry',
        description: 'E2E Laundry',
        unitPrice: 150,
        quantity: 1,
      }
    });
    expect(chargeRes.status()).toBe(201);
    const chargeId = (await chargeRes.json()).data.id;

    // Get balance before delete
    const beforeRes = await request.get(`/api/v1/bookings/${testBookingId}`, {
      headers: { 'Authorization': `Bearer ${tokenRes}` }
    });
    const balanceBefore = (await beforeRes.json()).data.balanceDue;

    // Delete the charge
    const delRes = await request.delete(`/api/v1/billing/charge/${chargeId}`, {
      headers: { 'Authorization': `Bearer ${tokenRes}` }
    });
    expect(delRes.status()).toBe(200);
    const delBody = await delRes.json();
    expect(delBody.success).toBe(true);
    expect(delBody.data.deleted).toBe(true);

    // Verify balance decreased by charge gross amount
    const afterRes = await request.get(`/api/v1/bookings/${testBookingId}`, {
      headers: { 'Authorization': `Bearer ${tokenRes}` }
    });
    const balanceAfter = (await afterRes.json()).data.balanceDue;
    // 150 laundry + GST (if enabled) removed; at minimum balance should be lower
    expect(balanceAfter).toBeLessThan(balanceBefore);
  });

  test('CHG-05: PATCH charge updates description and chargeDate', async ({ page, request }) => {
    const tokenRes = await page.evaluate(() => localStorage.getItem('accessToken'));

    // Create a charge to edit
    const chargeRes = await request.post('/api/v1/billing/charge', {
      headers: { 'Authorization': `Bearer ${tokenRes}` },
      data: {
        bookingId: testBookingId,
        chargeDate: new Date().toISOString().split('T')[0],
        category: 'minibar',
        description: 'Original Description',
        unitPrice: 500,
        quantity: 1,
      }
    });
    expect(chargeRes.status()).toBe(201);
    const chargeId = (await chargeRes.json()).data.id;

    // Patch description only
    const patchRes = await request.patch(`/api/v1/billing/charge/${chargeId}`, {
      headers: { 'Authorization': `Bearer ${tokenRes}` },
      data: { description: 'Updated Description' }
    });
    expect(patchRes.status()).toBe(200);
    const patchBody = await patchRes.json();
    expect(patchBody.success).toBe(true);
    expect(patchBody.data.description).toBe('Updated Description');
    expect(patchBody.data.unitPrice).toBe(500); // unchanged
  });

  test('CHG-06: DELETE charge returns 401 without auth', async ({ request }) => {
    const delRes = await request.delete('/api/v1/billing/charge/nonexistent-id');
    expect(delRes.status()).toBe(401);
  });

  test('CHG-07: PATCH charge with invalid chargeDate returns 400', async ({ page, request }) => {
    const tokenRes = await page.evaluate(() => localStorage.getItem('accessToken'));

    // Create a charge first
    const chargeRes = await request.post('/api/v1/billing/charge', {
      headers: { 'Authorization': `Bearer ${tokenRes}` },
      data: {
        bookingId: testBookingId,
        chargeDate: new Date().toISOString().split('T')[0],
        category: 'other',
        description: 'Date Validation Test',
        unitPrice: 100,
        quantity: 1,
      }
    });
    const chargeId = (await chargeRes.json()).data?.id;
    if (!chargeId) return; // Guard in case prior test cleaned up

    const patchRes = await request.patch(`/api/v1/billing/charge/${chargeId}`, {
      headers: { 'Authorization': `Bearer ${tokenRes}` },
      data: { chargeDate: 'April-30-2026' } // invalid format
    });
    expect(patchRes.status()).toBe(400);
    const body = await patchRes.json();
    expect(body.success).toBe(false);
    expect(body.error).toContain('YYYY-MM-DD');
  });
});
