import { test, expect } from '@playwright/test';

const BROWSER_URL = process.env.URL || 'http://localhost:3100';

test.describe('Dashboard UI & Rooms Modals E2E', () => {

  test.beforeEach(async ({ page }) => {
    // Inject mock auth token to bypass login directly to dashboard
    await page.addInitScript(() => {
      localStorage.setItem('accessToken', 'mock-valid-token');
      localStorage.setItem('user', JSON.stringify({ fullName: 'Staff User', role: 'admin' }));
      localStorage.setItem('tenantId', 'mock-tenant-id');
    });
  });

  test('Dashboard Sidebar navigation displays and collapses correctly', async ({ page, isMobile }) => {
    await page.goto(`${BROWSER_URL}/dashboard`);
    
    // Check elements exist
    await expect(page.getByRole('link', { name: 'istaysin' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Log out' })).toBeVisible();

    if (isMobile) {
      // Sidebar should be initially hidden on mobile
      const sidebar = page.locator('aside');
      await expect(sidebar).toHaveClass(/.*-translate-x-full.*/);

      // Open Sidebar
      await page.locator('button').locator('svg.lucide-menu').click();
      
      // Sidebar should transition in
      await expect(sidebar).toHaveClass(/.*translate-x-0.*/);

      // Verify category headings
      await expect(page.getByText('Management')).toBeVisible();
      await expect(page.getByText('Front Desk')).toBeVisible();
      
      // Verify new links
      await expect(page.getByRole('link', { name: 'Staff Shifts' })).toBeVisible();
      await expect(page.getByRole('link', { name: 'Channel Manager' })).toBeVisible();

      // Click "Rooms"
      await page.getByRole('link', { name: 'Rooms' }).click();

      // Sidebar should auto-close
      await expect(sidebar).toHaveClass(/.*-translate-x-full.*/);
      await expect(page).toHaveURL(/.*\/dashboard\/rooms/);
    } else {
      // Desktop Sidebar is always visible
      const sidebar = page.locator('aside');
      await expect(sidebar).toBeVisible();
      
      // Navigating
      await page.getByRole('link', { name: 'Rooms' }).click();
      await expect(page).toHaveURL(/.*\/dashboard\/rooms/);
    }
  });

  test('Rooms slide-out panels open and close with correct animations', async ({ page }) => {
    await page.goto(`${BROWSER_URL}/dashboard/rooms`);
    
    // Wait for initial load
    await expect(page.getByRole('heading', { name: 'Rooms', exact: true })).toBeVisible();

    // 1. Test "Manage Floors" panel
    await page.getByRole('button', { name: 'Floors' }).click();
    
    // Verify slide-out renders correctly over the backdrop
    const floorsPanel = page.getByRole('heading', { name: 'Manage Floors' });
    await expect(floorsPanel).toBeVisible();
    
    // Check UI aesthetic properties via classes matching our replacement
    const modalContainer = page.locator('.animate-slide-left');
    await expect(modalContainer).toBeVisible();
    await expect(modalContainer).toHaveClass(/.*bg-surface-950.*/);
    
    // Close using X
    await page.locator('.animate-slide-left button').locator('svg.lucide-x').click();
    await expect(floorsPanel).toBeHidden();

    // 2. Test "Manage Room Types" panel
    await page.getByRole('button', { name: 'Room Types' }).click();
    const typePanel = page.getByRole('heading', { name: 'Manage Room Types' });
    await expect(typePanel).toBeVisible();
    
    // Close by clicking backdrop
    await page.locator('.backdrop-blur-sm').click({ position: { x: 10, y: 10 } });
    await expect(typePanel).toBeHidden();

    // 3. Test "Add Room" panel
    await page.getByRole('button', { name: 'Add Room' }).click();
    const addRoomPanel = page.getByRole('heading', { name: 'Add Room' });
    await expect(addRoomPanel).toBeVisible();
    
    // Validate custom scrollbar hiding is applied gracefully to content section
    const contentBox = page.locator('.no-scrollbar').first();
    await expect(contentBox).toBeVisible();
    
    // Ensure the cancel button safely closes it
    await page.getByRole('button', { name: 'Cancel' }).click();
    await expect(addRoomPanel).toBeHidden();
  });
});
