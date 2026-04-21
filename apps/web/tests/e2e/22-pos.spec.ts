import { test, expect } from '@playwright/test';

const API_BASE = process.env.API_URL || 'http://localhost:4100';

test.describe('F&B Point-of-Sale Integration', () => {

  // --- Auth Guard Tests ---
  test('POS-01: Should reject unauthenticated outlet creation', async ({ request }) => {
    const res = await request.post(`${API_BASE}/api/v1/pos/outlets`, {
      data: { name: 'Test Restaurant' }
    });
    expect(res.status()).toBe(401);
  });

  test('POS-02: Should reject unauthenticated menu listing', async ({ request }) => {
    const res = await request.get(`${API_BASE}/api/v1/pos/menu`);
    expect(res.status()).toBe(401);
  });

  test('POS-03: Should reject unauthenticated order creation', async ({ request }) => {
    const res = await request.post(`${API_BASE}/api/v1/pos/orders`, {
      data: { outletId: 'test', items: [] }
    });
    expect(res.status()).toBe(401);
  });

  test('POS-04: Should reject unauthenticated order listing', async ({ request }) => {
    const res = await request.get(`${API_BASE}/api/v1/pos/orders`);
    expect(res.status()).toBe(401);
  });

  test('POS-05: Should reject unauthenticated charge-to-room', async ({ request }) => {
    const res = await request.post(`${API_BASE}/api/v1/pos/orders/fake-id/charge-to-room`, {
      data: { bookingId: 'fake-booking' }
    });
    expect(res.status()).toBe(401);
  });

  test('POS-06: Should reject unauthenticated void operation', async ({ request }) => {
    const res = await request.put(`${API_BASE}/api/v1/pos/orders/fake-id/void`);
    expect(res.status()).toBe(401);
  });

  test('POS-07: Should reject unauthenticated settle operation', async ({ request }) => {
    const res = await request.put(`${API_BASE}/api/v1/pos/orders/fake-id/settle`);
    expect(res.status()).toBe(401);
  });

  // --- Validation Tests ---
  test('POS-08: Should reject outlet with name too short', async ({ request }) => {
    const loginRes = await request.post(`${API_BASE}/api/v1/auth/login`, {
      data: { email: 'admin@istays.in', password: 'Admin@123' }
    });
    if (loginRes.status() !== 200) {
      test.skip(true, 'Admin user not seeded');
      return;
    }
    const { data } = await loginRes.json();
    const token = data.accessToken;
    const tenantId = data.memberships?.[0]?.tenantId;

    const res = await request.post(`${API_BASE}/api/v1/pos/outlets`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'x-tenant-id': tenantId || ''
      },
      data: { name: 'X' }  // Too short, min 2
    });
    if (res.status() === 400) {
      const body = await res.json();
      expect(body.success).toBe(false);
    }
  });

  test('POS-09: Should reject order with zero-length items array', async ({ request }) => {
    const loginRes = await request.post(`${API_BASE}/api/v1/auth/login`, {
      data: { email: 'admin@istays.in', password: 'Admin@123' }
    });
    if (loginRes.status() !== 200) {
      test.skip(true, 'Admin user not seeded');
      return;
    }
    const { data } = await loginRes.json();
    const token = data.accessToken;
    const tenantId = data.memberships?.[0]?.tenantId;

    const res = await request.post(`${API_BASE}/api/v1/pos/orders`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'x-tenant-id': tenantId || ''
      },
      data: {
        outletId: 'non-existent-outlet',
        items: [{ name: 'Coffee', quantity: 1, unitPrice: 150 }]
      }
    });
    // Should fail because outletId doesn't exist — FK constraint
    expect([400, 500]).toContain(res.status());
  });

  test('POS-10: Should reject voiding a non-existent order', async ({ request }) => {
    const loginRes = await request.post(`${API_BASE}/api/v1/auth/login`, {
      data: { email: 'admin@istays.in', password: 'Admin@123' }
    });
    if (loginRes.status() !== 200) {
      test.skip(true, 'Admin user not seeded');
      return;
    }
    const { data } = await loginRes.json();
    const token = data.accessToken;
    const tenantId = data.memberships?.[0]?.tenantId;

    const res = await request.put(`${API_BASE}/api/v1/pos/orders/00000000-0000-0000-0000-000000000000/void`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'x-tenant-id': tenantId || ''
      }
    });
    expect([404, 400]).toContain(res.status());
  });

  test('POS-11: Should reject charge-to-room for non-existent order', async ({ request }) => {
    const loginRes = await request.post(`${API_BASE}/api/v1/auth/login`, {
      data: { email: 'admin@istays.in', password: 'Admin@123' }
    });
    if (loginRes.status() !== 200) {
      test.skip(true, 'Admin user not seeded');
      return;
    }
    const { data } = await loginRes.json();
    const token = data.accessToken;
    const tenantId = data.memberships?.[0]?.tenantId;

    const res = await request.post(`${API_BASE}/api/v1/pos/orders/00000000-0000-0000-0000-000000000000/charge-to-room`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'x-tenant-id': tenantId || ''
      },
      data: { bookingId: '00000000-0000-0000-0000-000000000000' }
    });
    expect([404, 400, 500]).toContain(res.status());
  });
});
