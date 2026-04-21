import { test, expect } from '@playwright/test';

test.describe('OTA External Channel Configuration Matrix', () => {
  let adminToken: string;
  let tenantId: string;
  let roomTypeId: string;
  let connectionId: string;

  test.beforeEach(async ({ request }) => {
    // Authenticate Admin
    const adminRes = await request.post('/api/v1/auth/login', {
      data: { email: 'owner-premium@e2e.com', password: 'Welcome@1' }
    });
    adminToken = (await adminRes.json()).data.accessToken;

    // Fetch Property metrics
    const propRes = await request.get('/api/v1/public/properties/premium-resort-pro');
    const property = await propRes.json();
    tenantId = property.data.id;
    roomTypeId = property.data.roomTypes[0].id;

    // Context switch
    await request.post('/api/v1/tenants/switch', {
      headers: { 'Authorization': `Bearer ${adminToken}` },
      data: { tenantId }
    });
  });

  test('Generate Channel Connection and link internal Room Type correctly', async ({ request }) => {
    // 1. Setup MakeMyTrip Connection securely
    const connectRes = await request.post('/api/v1/channels', {
      headers: { 'Authorization': `Bearer ${adminToken}` },
      data: {
        channel: 'makemytrip',
        hotelId: 'MMT-HOTEL-999',
        apiKey: 'sk_test_mmt_812389123'
      }
    });
    
    // We expect success
    const connData = await connectRes.json();
    expect(connectRes.status()).toBe(201);
    expect(connData.data.isActive).toBe(true);
    connectionId = connData.data.id;

    // 2. Map internal "Standard Room" to external "MMT_DELUXE"
    const mappingRes = await request.post(`/api/v1/channels/${connectionId}/mappings`, {
      headers: { 'Authorization': `Bearer ${adminToken}` },
      data: {
        roomTypeId: roomTypeId,
        channelRoomId: 'MMT_DELUXE',
        channelRateId: 'MMT_RATE_B&B'
      }
    });

    const mappingData = await mappingRes.json();
    expect(mappingRes.status()).toBe(201);
    expect(mappingData.data.channelRoomId).toBe('MMT_DELUXE');

    // 3. Ensure API correctly fetches the mappings
    const fetchedMapRes = await request.get(`/api/v1/channels`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const fetchedData = await fetchedMapRes.json();
    
    // Assert mapping exists inside the list
    const foundConn = fetchedData.data.find((c: any) => c.id === connectionId);
    expect(foundConn).toBeDefined();
    expect(foundConn.mappings.length).toBeGreaterThanOrEqual(1);
    
    // Cleanup securely
    await request.delete(`/api/v1/channels/${connectionId}`, {
         headers: { 'Authorization': `Bearer ${adminToken}` }
    });
  });
});
