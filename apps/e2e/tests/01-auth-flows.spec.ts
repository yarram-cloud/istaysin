import { test, expect } from '@playwright/test';
import { LoginPage } from '../pom/login.page';

test.describe('Authentication Flows', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.goto();
  });

  test('Global Admin successfully logs in', async ({ page }) => {
    await loginPage.login('global-admin@e2e.com', 'Welcome@1');
    await expect(page).toHaveURL(/.*\/admin/);
    await expect(page.getByText('Platform Overview', { exact: false })).toBeVisible();
  });

  test('Lodge Owner successfully logs in', async ({ page }) => {
    await loginPage.login('owner-free@e2e.com', 'Welcome@1');
    await expect(page).toHaveURL(/.*\/dashboard/);
  });

  test('Shows error on invalid credentials', async ({ page }) => {
    await loginPage.login('wrong@e2e.com', 'BadPass', false);
    const errorMsg = await loginPage.getErrorMessage();
    expect(errorMsg).toBeTruthy();
  });

  test('Cross-tenant access is blocked at the API level', async ({ page }) => {
    // Step 1: get basic owner's tenantId
    await loginPage.goto();
    await loginPage.login('owner-basic@e2e.com', 'Welcome@1');
    await expect(page).toHaveURL(/.*\/dashboard/);
    const basicTenantId = await page.evaluate(() => localStorage.getItem('tenantId'));
    expect(basicTenantId).toBeTruthy();

    // Step 2: log in as free owner — saveAuthData clears the stale tenantId
    await page.goto('/login');
    await loginPage.login('owner-free@e2e.com', 'Welcome@1');
    await expect(page).toHaveURL(/.*\/dashboard/);

    const freeToken = await page.evaluate(() => localStorage.getItem('accessToken'));
    const freeTenantId = await page.evaluate(() => localStorage.getItem('tenantId'));
    expect(freeTenantId).not.toEqual(basicTenantId);

    // Step 3: use free owner's token but try to access basic owner's tenant
    const res = await page.request.get('/api/v1/dashboard', {
      headers: {
        Authorization: `Bearer ${freeToken}`,
        'x-tenant-id': basicTenantId!,
        'Content-Type': 'application/json',
      },
    });

    // Must be rejected — free owner is not a member of basic tenant
    expect(res.status()).toBe(403);
    const body = await res.json();
    expect(body.success).toBe(false);
  });

  test('saveAuthData clears stale tenantId on fresh login', async ({ page }) => {
    // Login as basic owner, then login as free owner — tenantId must switch
    await loginPage.goto();
    await loginPage.login('owner-basic@e2e.com', 'Welcome@1');
    await expect(page).toHaveURL(/.*\/dashboard/);
    const basicTenantId = await page.evaluate(() => localStorage.getItem('tenantId'));

    await page.goto('/login');
    await loginPage.login('owner-free@e2e.com', 'Welcome@1');
    await expect(page).toHaveURL(/.*\/dashboard/);
    const freeTenantId = await page.evaluate(() => localStorage.getItem('tenantId'));

    expect(freeTenantId).not.toEqual(basicTenantId);
    expect(freeTenantId).toBeTruthy();
  });
});
