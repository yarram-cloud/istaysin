import { test, expect } from '@playwright/test';
import { GuestBookingPage } from '../pom/guest-booking.page';

test.describe('Dynamic Pricing Automation Workflow', () => {
  let guestBookingPage: GuestBookingPage;
  let adminToken: string;
  let tenantId: string;
  let roomTypeId: string;
  let baseRate: number;

  test.beforeEach(async ({ page, request }) => {
    guestBookingPage = new GuestBookingPage(page);

    // 1. Authenticate as Admin to inject UI Rules
    const loginRes = await request.post('/api/v1/auth/login', {
      data: { identifier: 'owner-premium@e2e.com', password: 'Welcome@1' }
    });
    const loginData = await loginRes.json();
    adminToken = loginData.data.accessToken;
    
    // Fetch Property metadata 
    const propRes = await request.get('/api/v1/public/properties/premium-resort-pro');
    const property = await propRes.json();
    tenantId = property.data.id;
    roomTypeId = property.data.roomTypes[0].id;
    baseRate = property.data.roomTypes[0].baseRate; // Let's say 4000
    
    await request.post('/api/v1/tenants/switch', {
      headers: { 'Authorization': `Bearer ${adminToken}` },
      data: { tenantId }
    });
  });

  test('Pricing Rule dictates +50% hike rendering correctly inside Public Widget checkout', async ({ page, request }) => {
    // 1. Create a huge Flat Rate hike (e.g. + 5000 INR) applying generally across all days 
    // to easily assert via Widget 
    await request.post('/api/v1/pricing', {
      headers: { 'Authorization': `Bearer ${adminToken}` },
      data: {
        name: 'E2E Mega Event Hike',
        adjustmentType: 'flat_increase',
        adjustmentValue: 5000, 
        daysOfWeek: [0, 1, 2, 3, 4, 5, 6], // All Days
        roomTypeId: roomTypeId,
        priority: 100, // Top priority override
        isActive: true
      }
    });

    // 2. Load the Consumer Booking UI 
    await guestBookingPage.gotoPublicProperty('premium-resort-pro');

    // 3. Set standard defaults tomorrow and day after
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    const dayAfter = new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0];
    await guestBookingPage.setDates(tomorrow, dayAfter);

    // 4. Click Book Now widget to load /book
    await guestBookingPage.clickBookNow();

    // 5. Select the exact Room type
    // Since pricing returned should trigger the price to be baseRate + 5000
    const expectedRate = baseRate + 5000;
    
    // Check if the checkout UI rendered the inflated price
    const displayedPrice = await page.locator('.room-card-price').first().innerText();
    // E.g. "₹9000 / night"
    expect(displayedPrice.replace(/[^0-9]/g, '')).toContain(expectedRate.toString());

    // Clean up Pricing Rule to avoid poisoning future tests
    const rulesRes = await request.get('/api/v1/pricing', {
         headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const rules = await rulesRes.json();
    const targetRule = rules.data.find((r: any) => r.name === 'E2E Mega Event Hike');
    if (targetRule) {
      await request.delete(`/api/v1/pricing/${targetRule.id}`, {
         headers: { 'Authorization': `Bearer ${adminToken}` }
      });
    }
  });
});
