# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: apps\e2e\tests\14-ota-channels.spec.ts >> OTA External Channel Configuration Matrix >> Generate Channel Connection and link internal Room Type correctly
- Location: apps\e2e\tests\14-ota-channels.spec.ts:29:7

# Error details

```
TypeError: apiRequestContext.post: Invalid URL
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('OTA External Channel Configuration Matrix', () => {
  4  |   let adminToken: string;
  5  |   let tenantId: string;
  6  |   let roomTypeId: string;
  7  |   let connectionId: string;
  8  | 
  9  |   test.beforeEach(async ({ request }) => {
  10 |     // Authenticate Admin
> 11 |     const adminRes = await request.post('/api/v1/auth/login', {
     |                                    ^ TypeError: apiRequestContext.post: Invalid URL
  12 |       data: { email: 'owner-premium@e2e.com', password: 'Welcome@1' }
  13 |     });
  14 |     adminToken = (await adminRes.json()).data.accessToken;
  15 | 
  16 |     // Fetch Property metrics
  17 |     const propRes = await request.get('/api/v1/public/properties/premium-resort-pro');
  18 |     const property = await propRes.json();
  19 |     tenantId = property.data.id;
  20 |     roomTypeId = property.data.roomTypes[0].id;
  21 | 
  22 |     // Context switch
  23 |     await request.post('/api/v1/tenants/switch', {
  24 |       headers: { 'Authorization': `Bearer ${adminToken}` },
  25 |       data: { tenantId }
  26 |     });
  27 |   });
  28 | 
  29 |   test('Generate Channel Connection and link internal Room Type correctly', async ({ request }) => {
  30 |     // 1. Setup MakeMyTrip Connection securely
  31 |     const connectRes = await request.post('/api/v1/channels', {
  32 |       headers: { 'Authorization': `Bearer ${adminToken}` },
  33 |       data: {
  34 |         channel: 'makemytrip',
  35 |         hotelId: 'MMT-HOTEL-999',
  36 |         apiKey: 'sk_test_mmt_812389123'
  37 |       }
  38 |     });
  39 |     
  40 |     // We expect success
  41 |     const connData = await connectRes.json();
  42 |     expect(connectRes.status()).toBe(201);
  43 |     expect(connData.data.isActive).toBe(true);
  44 |     connectionId = connData.data.id;
  45 | 
  46 |     // 2. Map internal "Standard Room" to external "MMT_DELUXE"
  47 |     const mappingRes = await request.post(`/api/v1/channels/${connectionId}/mappings`, {
  48 |       headers: { 'Authorization': `Bearer ${adminToken}` },
  49 |       data: {
  50 |         roomTypeId: roomTypeId,
  51 |         channelRoomId: 'MMT_DELUXE',
  52 |         channelRateId: 'MMT_RATE_B&B'
  53 |       }
  54 |     });
  55 | 
  56 |     const mappingData = await mappingRes.json();
  57 |     expect(mappingRes.status()).toBe(201);
  58 |     expect(mappingData.data.channelRoomId).toBe('MMT_DELUXE');
  59 | 
  60 |     // 3. Ensure API correctly fetches the mappings
  61 |     const fetchedMapRes = await request.get(`/api/v1/channels`, {
  62 |       headers: { 'Authorization': `Bearer ${adminToken}` }
  63 |     });
  64 |     const fetchedData = await fetchedMapRes.json();
  65 |     
  66 |     // Assert mapping exists inside the list
  67 |     const foundConn = fetchedData.data.find((c: any) => c.id === connectionId);
  68 |     expect(foundConn).toBeDefined();
  69 |     expect(foundConn.mappings.length).toBeGreaterThanOrEqual(1);
  70 |     
  71 |     // Cleanup securely
  72 |     await request.delete(`/api/v1/channels/${connectionId}`, {
  73 |          headers: { 'Authorization': `Bearer ${adminToken}` }
  74 |     });
  75 |   });
  76 | });
  77 | 
```