import { test, expect } from '@playwright/test';
import { LoginPage } from '../pom/login.page';

test.describe('Payment Settings and BYOK Gateway', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.goto();
    // Use the global test admin account that was provisioned in global-setup
    await loginPage.login('owner-premium@e2e.com', 'Welcome@1');
  });

  test('should securely save and mask Razorpay BYOK credentials', async ({ page, request }) => {
    // 1. Traverse to the Settings -> Payment Gateways Page
    await page.goto('/dashboard/settings');
    await page.click('text=Payment Gateways');

    // 2. Input test keys
    const testKeyId = 'rzp_test_123456';
    const testSecret = 'rzp_test_secret_456789';

    await page.fill('input[placeholder="rzp_live_xxxxxxxxxxxxxx"]', testKeyId);
    await page.fill('input[placeholder="••••••••••••••••••••"]', testSecret);

    // 3. Save Settings & Wait for API response
    const savePromise = page.waitForResponse(response => 
      response.url().includes('/settings') && response.request().method() === 'PATCH' && response.status() === 200
    );
    await page.click('button:has-text("Save Payment Settings")');
    const response = await savePromise;
    console.log('PATCH REQ:', response.request().postData());
    console.log('PATCH RES:', await response.text());
    
    // Optional: wait for UI toast or animation
    await page.waitForTimeout(500);

    // 4. Reload page to verify the backend successfully masks the secret upon GET
    await page.reload();
    await page.click('text=Payment Gateways');

    await expect(page.locator('input[placeholder="rzp_live_xxxxxxxxxxxxxx"]')).toHaveValue(testKeyId);
    await expect(page.locator('input[placeholder="••••••••••••••••••••"]')).toHaveValue('••••••••••••••••');

    // 5. Test the Backend /payments/razorpay/order API validation
    // First, let's grab the current active tenant payload from browser
    const token = await page.evaluate(() => localStorage.getItem('accessToken'));
    const tenantId = await page.evaluate(() => localStorage.getItem('tenantId'));
    console.log('extracted tenantId:', tenantId);

    const orderRes = await request.post('/api/v1/payments/razorpay/order', {
      headers: {
        'x-tenant-id': tenantId || '',
        'Authorization': `Bearer ${token}`
      },
      data: {
        bookingId: 'invalid-uuid-0000-0000', 
        amount: 1000
      }
    });

    const orderJson = await orderRes.json();
    
    // It should hit 'Booking not found' because the Gateway config check successfully passed (keys are active).
    expect(orderJson.success).toBe(false);
    expect(orderJson.error).toContain('Booking not found');
  });
});
