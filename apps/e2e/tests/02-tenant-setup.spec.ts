import { test, expect } from '@playwright/test';
import { RegisterPage } from '../pom/register.page';
import { LoginPage } from '../pom/login.page';

// Unique suffix per run to avoid DB unique-constraint collisions
const runId = Date.now().toString().slice(-6);

// Valid 10-digit Indian mobile unique per run (prefix 9090 + 6-digit runId)
const ownerPhone = `9090${runId}`;

const propertyPayload = {
  name: `Premium Lodge ${runId}`,
  type: 'lodge',
  contactPhone: '9876543210',
  city: 'Mumbai',
  state: 'Maharashtra',
  pincode: '400001',
};

const ownerPayload = {
  fullName: `Owner ${runId}`,
  phone: ownerPhone,
  password: 'SecurePass123!',
};

test.describe('Property Registration & Admin Approval Flow', () => {

  test('Owner successfully registers a new property and is isolated to their tenant', async ({ page }) => {
    // Mock Nominatim so the map doesn't block in CI
    await page.route('https://nominatim.openstreetmap.org/**', async (route) => {
      await route.fulfill({
        json: {
          address: { city: 'Mumbai', state: 'Maharashtra', postcode: '400001' },
          display_name: 'Mumbai, Maharashtra 400001',
        },
      });
    });

    const registerPage = new RegisterPage(page);
    await registerPage.register(propertyPayload, ownerPayload);

    // Dashboard should show this user's (empty) tenant — not another user's data
    const tenantId = await page.evaluate(() => localStorage.getItem('tenantId'));
    expect(tenantId).toBeTruthy();
    expect(tenantId).toMatch(/^[0-9a-f-]{36}$/i);

    // recentBookings for a brand-new property must be empty
    const token = await page.evaluate(() => localStorage.getItem('accessToken'));
    const dashRes = await page.request.get('/api/v1/dashboard', {
      headers: {
        Authorization: `Bearer ${token}`,
        'x-tenant-id': tenantId!,
        'Content-Type': 'application/json',
      },
    });
    expect(dashRes.ok()).toBeTruthy();
    const dashData = await dashRes.json();
    expect(dashData.data.recentBookings).toHaveLength(0);
  });

  test('Global Admin approves the newly registered property', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('global-admin@e2e.com', 'Welcome@1');
    await expect(page).toHaveURL(/.*\/admin/);

    await page.goto('/admin/registrations');

    const propertyCard = page.locator('.glass-card', { hasText: propertyPayload.name });
    await expect(propertyCard).toBeVisible({ timeout: 10000 });

    await propertyCard.getByRole('button', { name: 'Approve' }).click();

    const confirmButton = page.getByRole('button', { name: /Confirm Approval/i });
    if (await confirmButton.isVisible()) {
      await confirmButton.click();
    }

    await expect(propertyCard).not.toBeVisible({ timeout: 10000 });
  });

});
