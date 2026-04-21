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
});
