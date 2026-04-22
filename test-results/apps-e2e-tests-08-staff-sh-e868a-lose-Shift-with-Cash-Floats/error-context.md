# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: apps\e2e\tests\08-staff-shifts-and-cash.spec.ts >> Staff Shifts and Handover Workflows >> Open Shift, calculate discrepancy, and Close Shift with Cash Floats
- Location: apps\e2e\tests\08-staff-shifts-and-cash.spec.ts:32:7

# Error details

```
TypeError: apiRequestContext.post: Invalid URL
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Staff Shifts and Handover Workflows', () => {
  4  |   let adminToken: string;
  5  |   let tenantId: string;
  6  |   let adminUserId: string;
  7  | 
  8  |   test.beforeEach(async ({ page, request }) => {
  9  |     // We execute a raw backend authentication to fetch the JWT and Admin ID
> 10 |     const loginRes = await request.post('/api/v1/auth/login', {
     |                                    ^ TypeError: apiRequestContext.post: Invalid URL
  11 |       data: {
  12 |         email: 'owner-premium@e2e.com',
  13 |         password: 'Welcome@1',
  14 |       }
  15 |     });
  16 |     const loginData = await loginRes.json();
  17 |     adminToken = loginData.data.accessToken;
  18 |     adminUserId = loginData.data.user.id;
  19 |     
  20 |     // Fetch premium-resort-pro tenantId securely
  21 |     const propRes = await request.get('/api/v1/public/properties/premium-resort-pro');
  22 |     const property = await propRes.json();
  23 |     tenantId = property.data.id;
  24 |     
  25 |     // Mount the token into context for api interactions
  26 |     await request.post('/api/v1/tenants/switch', {
  27 |       headers: { 'Authorization': `Bearer ${adminToken}` },
  28 |       data: { tenantId }
  29 |     });
  30 |   });
  31 | 
  32 |   test('Open Shift, calculate discrepancy, and Close Shift with Cash Floats', async ({ request }) => {
  33 |     // 1. Create a "Scheduled Shift" with a Starting Float of 5000 INR
  34 |     const startTimeStamp = new Date().toISOString();
  35 |     const endTimeStamp = new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(); // +8 hours
  36 |     
  37 |     const shiftRes = await request.post('/api/v1/shifts', {
  38 |       headers: { 'Authorization': `Bearer ${adminToken}` },
  39 |       data: {
  40 |         userId: adminUserId,
  41 |         role: 'front_desk',
  42 |         startTime: startTimeStamp,
  43 |         endTime: endTimeStamp,
  44 |         startingFloat: 5000,
  45 |         notes: 'E2E Testing Handover Open'
  46 |       }
  47 |     });
  48 | 
  49 |     const shiftData = await shiftRes.json();
  50 |     expect(shiftData.success).toBeTruthy();
  51 |     const shiftId = shiftData.data.id;
  52 |     
  53 |     // Assert Starting Float hit the database correctly!
  54 |     expect(shiftData.data.startingFloat).toBe(5000);
  55 |     expect(shiftData.data.status).toBe('scheduled');
  56 | 
  57 |     // 2. Perform End Of Shift Handover (Closing Drawer)
  58 |     // Assume we received 1000 INR in cash during the shift.
  59 |     // The expected drawer amount should be 6000. 
  60 |     // We will simulate a cashier entering 6000. System records 0 discrepancy.
  61 |     const closeRes = await request.put(`/api/v1/shifts/${shiftId}`, {
  62 |       headers: { 'Authorization': `Bearer ${adminToken}` },
  63 |       data: {
  64 |         status: 'completed',
  65 |         endingFloat: 6000,
  66 |         cashDiscrepancy: 0,
  67 |         handoverNotes: 'All cash accounted for.'
  68 |       }
  69 |     });
  70 | 
  71 |     const closeData = await closeRes.json();
  72 |     expect(closeData.success).toBeTruthy();
  73 |     
  74 |     // Assert the Handover registered!
  75 |     expect(closeData.data.status).toBe('completed');
  76 |     expect(closeData.data.endingFloat).toBe(6000);
  77 |     expect(closeData.data.cashDiscrepancy).toBe(0);
  78 |     expect(closeData.data.handoverNotes).toBe('All cash accounted for.');
  79 |   });
  80 | });
  81 | 
```