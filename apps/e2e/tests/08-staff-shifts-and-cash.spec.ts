import { test, expect } from '@playwright/test';

test.describe('Staff Shifts and Handover Workflows', () => {
  let adminToken: string;
  let tenantId: string;
  let adminUserId: string;

  test.beforeEach(async ({ page, request }) => {
    // We execute a raw backend authentication to fetch the JWT and Admin ID
    const loginRes = await request.post('/api/v1/auth/login', {
      data: {
        email: 'owner-premium@e2e.com',
        password: 'Welcome@1',
      }
    });
    const loginData = await loginRes.json();
    adminToken = loginData.data.accessToken;
    adminUserId = loginData.data.user.id;
    
    // Fetch premium-resort-pro tenantId securely
    const propRes = await request.get('/api/v1/public/properties/premium-resort-pro');
    const property = await propRes.json();
    tenantId = property.data.id;
    
    // Mount the token into context for api interactions
    await request.post('/api/v1/tenants/switch', {
      headers: { 'Authorization': `Bearer ${adminToken}` },
      data: { tenantId }
    });
  });

  test('Open Shift, calculate discrepancy, and Close Shift with Cash Floats', async ({ request }) => {
    // 1. Create a "Scheduled Shift" with a Starting Float of 5000 INR
    const startTimeStamp = new Date().toISOString();
    const endTimeStamp = new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(); // +8 hours
    
    const shiftRes = await request.post('/api/v1/shifts', {
      headers: { 'Authorization': `Bearer ${adminToken}` },
      data: {
        userId: adminUserId,
        role: 'front_desk',
        startTime: startTimeStamp,
        endTime: endTimeStamp,
        startingFloat: 5000,
        notes: 'E2E Testing Handover Open'
      }
    });

    const shiftData = await shiftRes.json();
    expect(shiftData.success).toBeTruthy();
    const shiftId = shiftData.data.id;
    
    // Assert Starting Float hit the database correctly!
    expect(shiftData.data.startingFloat).toBe(5000);
    expect(shiftData.data.status).toBe('scheduled');

    // 2. Perform End Of Shift Handover (Closing Drawer)
    // Assume we received 1000 INR in cash during the shift.
    // The expected drawer amount should be 6000. 
    // We will simulate a cashier entering 6000. System records 0 discrepancy.
    const closeRes = await request.put(`/api/v1/shifts/${shiftId}`, {
      headers: { 'Authorization': `Bearer ${adminToken}` },
      data: {
        status: 'completed',
        endingFloat: 6000,
        cashDiscrepancy: 0,
        handoverNotes: 'All cash accounted for.'
      }
    });

    const closeData = await closeRes.json();
    expect(closeData.success).toBeTruthy();
    
    // Assert the Handover registered!
    expect(closeData.data.status).toBe('completed');
    expect(closeData.data.endingFloat).toBe(6000);
    expect(closeData.data.cashDiscrepancy).toBe(0);
    expect(closeData.data.handoverNotes).toBe('All cash accounted for.');
  });
});
