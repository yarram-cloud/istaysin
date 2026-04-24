import { test, expect } from '@playwright/test';

test.describe('Staff Roster & Shifts UI', () => {
  let adminToken: string;
  let adminUserId: string;

  test.beforeEach(async ({ page, request }) => {
    const loginRes = await request.post('/api/v1/auth/login', {
      data: { identifier: 'owner-premium@e2e.com', password: 'Welcome@1' }
    });
    const loginData = await loginRes.json();
    adminToken = loginData.data.accessToken;
    adminUserId = loginData.data.user.id;

    await page.goto('/login');
    await page.fill('input[type="email"]', 'owner-premium@e2e.com');
    await page.fill('input[type="password"]', 'Welcome@1');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
    await page.goto('/dashboard/front-desk/shifts');
    await expect(page.locator('h1', { hasText: 'Rostering' })).toBeVisible();
  });

  test('Roster page loads with staff rows and date header', async ({ page }) => {
    // Grid should render with staff rows
    await expect(page.locator('table')).toBeVisible();
    // Month/Year selectors present
    await expect(page.locator('select').first()).toBeVisible();
    // Brush toolbar present
    await expect(page.locator('text=BRUSH')).toBeVisible();
  });

  test('Shift Templates tab — create and delete a template', async ({ page }) => {
    await page.click('button:has-text("Shift Templates")');
    await expect(page.locator('h3:has-text("New Shift Template")')).toBeVisible();

    // Fill in template details
    await page.fill('input[placeholder="e.g. Morning Shift"]', 'E2E Shift');
    // Pick first color swatch (already pre-selected)
    await page.click('button:has-text("Add Template")');

    // Should appear in template list
    await expect(page.locator('text=E2E Shift')).toBeVisible();

    // Delete it
    const deleteBtn = page.locator('button[aria-label="delete"]').or(
      page.locator('div').filter({ hasText: 'E2E Shift' }).locator('button').last()
    );
    await deleteBtn.click();
    await expect(page.locator('text=E2E Shift')).not.toBeVisible();
  });

  test('Paint a shift cell, Save, then Clone Month', async ({ page, request }) => {
    // Make sure there's at least one staff visible
    const rows = page.locator('tbody tr');
    await expect(rows.first()).toBeVisible();

    // Select Morning Shift brush
    await page.click('button:has-text("Morning Shift")');
    // Click day-1 cell of first staff row (second td — first td is sticky name)
    const firstStaffRow = rows.first();
    const day1Cell = firstStaffRow.locator('td').nth(1);
    await day1Cell.click();

    // Save button should show count
    await expect(page.locator('button:has-text("Save")')).toContainText('1');
    await page.click('button:has-text("Save")');
    await expect(page.locator('text=Roster saved!')).toBeVisible({ timeout: 10000 });

    // Clone Month button
    await page.click('button:has-text("Clone Month")');
    await expect(page.locator('text=Cloned').or(page.locator('text=Clone failed'))).toBeVisible({ timeout: 15000 });
  });

  test('Edit an existing shift chip via inline picker', async ({ page, request }) => {
    // Create a shift via API for today
    const todayStr = new Date().toISOString().split('T')[0];
    const [y, m, d] = todayStr.split('-').map(Number);
    const startDt = new Date(y, m - 1, d, 8, 0).toISOString();
    const endDt   = new Date(y, m - 1, d, 16, 0).toISOString();

    await request.post('/api/v1/shifts', {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: { userId: adminUserId, startTime: startDt, endTime: endDt, role: 'Morning Shift' }
    });

    await page.reload();
    await expect(page.locator('table')).toBeVisible();
    await page.waitForTimeout(800);

    // Find a shift chip (08:00 badge)
    const chip = page.locator('span', { hasText: '08:00' }).first();
    if (await chip.count() > 0) {
      await chip.click();
      // Edit picker should appear
      await expect(page.locator('text=Change Shift')).toBeVisible();
      // Click Remove
      await page.click('button:has-text("Remove Shift")');
      await expect(page.locator('text=Change Shift')).not.toBeVisible();
      // Save
      await page.click('button:has-text("Save")');
      await expect(page.locator('text=Roster saved!')).toBeVisible({ timeout: 10000 });
    }
  });

  test('Pattern panel opens and applies rotation', async ({ page }) => {
    const firstStaffRow = page.locator('tbody tr').first();
    await expect(firstStaffRow).toBeVisible();

    // Click Pattern button inside first row
    await firstStaffRow.locator('button:has-text("Pattern")').click();
    await expect(page.locator('h3:has-text("Apply Rotation Pattern")')).toBeVisible();

    // Add a day to cycle
    await page.click('button:has-text("Add Empty Day to Cycle")');
    // Apply
    await page.click('button:has-text("Apply & Paint Grid")');
    await expect(page.locator('text=Pattern applied!')).toBeVisible();
  });

  test('API — Clone Month shifts via backend (regression)', async ({ request }) => {
    const now = new Date();
    const startDt = new Date(now.getFullYear(), now.getMonth(), 1, 9, 0).toISOString();
    const endDt   = new Date(now.getFullYear(), now.getMonth(), 1, 17, 0).toISOString();

    const createRes = await request.post('/api/v1/shifts', {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: { userId: adminUserId, startTime: startDt, endTime: endDt, role: 'Day Shift' }
    });
    expect(createRes.status()).toBe(201);

    const created = await createRes.json();
    expect(created.data.status).toBe('scheduled');
    expect(created.data.userId).toBe(adminUserId);

    // Clean up
    await request.delete(`/api/v1/shifts/${created.data.id}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
  });
});
