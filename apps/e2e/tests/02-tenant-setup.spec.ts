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

  test('Owner successfully registers a new property and lands on pending-approval page', async ({ page }) => {
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

    // After registration, tenant is pending_approval — must NOT land on dashboard
    await expect(page).toHaveURL(/.*\/pending-approval/);

    // tenantId must be set so the pending-approval page and API can resolve the tenant
    const tenantId = await page.evaluate(() => localStorage.getItem('tenantId'));
    expect(tenantId).toBeTruthy();
    expect(tenantId).toMatch(/^[0-9a-f-]{36}$/i);

    // API-level isolation: brand-new tenant must have no bookings (not another tenant's data)
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

  test('Approved owner can log in and access dashboard', async ({ page }) => {
    // After admin approval (previous test), owner's tenant is now active.
    // Login with the phone number used during registration.
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(`+91${ownerPhone}`, ownerPayload.password);

    // Active tenant → must redirect to dashboard, not pending-approval
    await expect(page).toHaveURL(/.*\/dashboard/, { timeout: 20000 });

    // Property name should appear in the sidebar
    await expect(page.getByText(propertyPayload.name, { exact: false })).toBeVisible({ timeout: 5000 });
  });

});
