import { test, expect } from '@playwright/test';

test.describe('Night Audit Flow', () => {
  // Use existing setup or standard login
  test('should view night audit dashboard and verify elements', async ({ page }) => {
    // Go directly to login
    await page.goto('http://localhost:3000/login');
    
    // Check if we need to login or if session persists
    const url = page.url();
    if (url.includes('/login')) {
      await page.fill('input[type="email"]', 'john@example.com');
      await page.fill('input[type="password"]', 'password123');
      await page.click('button[type="submit"]');
    }
    
    // Navigate to Night Audit Dashboard
    await page.goto('http://localhost:3000/dashboard/night-audit');
    
    // Wait for the page to render
    await page.waitForLoadState('networkidle');

    // Verify main sections
    await expect(page.getByRole('heading', { name: 'Night Audit', exact: true })).toBeVisible();
    await expect(page.getByText('Occupancy Summary')).toBeVisible();
    await expect(page.getByText('Projected Revenue')).toBeVisible();
    await expect(page.getByText('Payments Collected')).toBeVisible();
    await expect(page.getByText('Action Required')).toBeVisible();
    await expect(page.getByText('Audit History')).toBeVisible();
  });

  test('should open and close confirmation modal safely', async ({ page }) => {
    await page.goto('http://localhost:3000/login');
    const url = page.url();
    if (url.includes('/login')) {
      await page.fill('input[type="email"]', 'john@example.com');
      await page.fill('input[type="password"]', 'password123');
      await page.click('button[type="submit"]');
    }
    await page.goto('http://localhost:3000/dashboard/night-audit');
    
    // Wait for data
    await page.waitForLoadState('networkidle');

    // Button may be 'Run Night Audit' or 'Audit Completed'
    const runBtn = page.getByRole('button', { name: 'Run Night Audit' });
    
    if (await runBtn.isVisible()) {
      await runBtn.click();
      
      // Verify modal
      const modalHeading = page.getByRole('heading', { name: 'Run Night Audit?' });
      await expect(modalHeading).toBeVisible();
      
      // Cancel the operation to leave DB intact
      await page.getByRole('button', { name: 'Cancel' }).click();
      await expect(modalHeading).not.toBeVisible();
    }
  });
});
