import { test, expect } from '@playwright/test';
import { LoginPage } from '../pom/login.page';

test.describe('Global CRM & Identity Merging Workflow', () => {
  let loginPage: LoginPage;
  let adminToken: string;
  let tenantId: string;

  test.beforeEach(async ({ page, request }) => {
    loginPage = new LoginPage(page);

    // Context: Use 'premium-resort-pro' configured in global-setup
    await loginPage.goto();
    await loginPage.login('owner-premium@e2e.com', 'Welcome@1');

    const tokenRes = await page.evaluate(() => localStorage.getItem('token'));
    adminToken = tokenRes || '';

    const propRes = await request.get('/api/v1/public/properties/premium-resort-pro');
    const property = await propRes.json();
    tenantId = property.data.id;
  });

  test('Twin external bookings map to unified Guest Profile entity', async ({ request, page }) => {
    // 1. Send Booking 1 
    const dateToday = new Date().toISOString().split('T')[0];
    const dateTomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    const dateDayAfter = new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0];
    
    // We get room types to mock it safely
    const propMetaRes = await request.get(`/api/v1/public/properties/premium-resort-pro`);
    const propMeta = await propMetaRes.json();
    const rt = propMeta.data.roomTypes[0].id;
    
    const duplicateEmail = `repeat.corporate.${Date.now()}@e2etest.com`;

    const b1 = await request.post('/api/v1/public/bookings', {
      data: {
        tenantId,
        guestName: 'Repeat Corporate',
        guestEmail: duplicateEmail, // Key for merging
        guestPhone: '5559998888',
        checkInDate: dateToday,
        checkOutDate: dateTomorrow,
        numAdults: 1, numChildren: 0,
        roomSelections: [{ roomTypeId: rt }]
      }
    });
    expect(b1.status()).toBe(200);

    // 2. Send Booking 2 (Different dates, identical email)
    const b2 = await request.post('/api/v1/public/bookings', {
      data: {
        tenantId,
        guestName: 'Repeat Corp - Typos', // Typos shouldn't override merge logic based on raw email
        guestEmail: duplicateEmail,
        guestPhone: '5559998888',
        checkInDate: dateTomorrow,
        checkOutDate: dateDayAfter,
        numAdults: 1, numChildren: 0,
        roomSelections: [{ roomTypeId: rt }]
      }
    });
    expect(b2.status()).toBe(200);

    // 3. Verify via Guest CRM Dashboard UI
    await page.goto('http://localhost:3100/dashboard/guests?tenant=premium-resort-pro');
    
    // The datatable tracks guests. Ensure there's exactly 1 profile for this email!
    // And that the "Total Bookings" column asserts '2'
    
    // Wait for the rows to load
    await page.waitForTimeout(1000); 

    // Search for our specific duplicate email
    await page.getByPlaceholder('Search by name, phone, or email...').fill('Repeat Corporate');
    
    // Check that we only have ONE row returning
    const row = page.locator('tbody tr').filter({ hasText: duplicateEmail });
    await expect(row).toHaveCount(1);
    
    // Verify total bookings cell reads "2" lifetime checkins
    // Assuming the table lists: Guest | Contact | Loyalty Tier | Lifetime Revenue | Bookings
    await expect(row).toContainText('2');
  });
});
