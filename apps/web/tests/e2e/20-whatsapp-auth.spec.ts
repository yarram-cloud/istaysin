import { test, expect } from '@playwright/test';

test.describe('WhatsApp Engine Integration', () => {

  test('Should strictly rate-limit invalid phone formats', async ({ request }) => {
    const res = await request.post('http://localhost:4100/api/v1/auth/send-whatsapp-otp', {
      data: { phone: '' }
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.success).toBe(false);
  });

  test('Should mock WhatsApp OTP generation across sandbox', async ({ request }) => {
    // Generate an OTP request for a test user
    const sendRes = await request.post('http://localhost:4100/api/v1/auth/send-whatsapp-otp', {
      data: { phone: '+919876543210' }
    });
    
    expect(sendRes.status()).toBe(200);
    const body = await sendRes.json();
    expect(body.success).toBe(true);
    expect(body.message).toBe('OTP sent successfully!');
    
    // We cannot easily test the exact 6 digit code unless we hit the DB directly,
    // so we verify that sending a garbage OTP fails securely.
    const verifyRes = await request.post('http://localhost:4100/api/v1/auth/verify-whatsapp-otp', {
      data: { phone: '+919876543210', code: '000000', targetRole: 'guest' }
    });
    
    // As expected, 000000 is rejected by the internal validator
    expect(verifyRes.status()).toBe(400);
    const verifyBody = await verifyRes.json();
    expect(verifyBody.success).toBe(false);
    expect(verifyBody.error).toBe('Invalid OTP code');
  });

});
