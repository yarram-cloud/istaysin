import { test, expect } from '@playwright/test';
import { LoginPage } from '../pom/login.page';
import { RoomsPage } from '../pom/rooms.page';

test.describe('Rooms & Inventory Management Flow', () => {

  test.beforeEach(async ({ page }) => {
    // Spoof IP to bypass the 10-request auth rate limiter
    await page.setExtraHTTPHeaders({ 
      'x-forwarded-for': `192.168.1.${Math.floor(Math.random() * 254) + 1}` 
    });

    // Log in as an existing owner from global-setup
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('owner-free@e2e.com', 'Welcome@1');
    await expect(page).toHaveURL(/.*\/dashboard/);
  });

  test('Owner can create floors, room types, and rooms via dedicated settings pages', async ({ page }) => {
    page.on('dialog', dialog => {
      console.log(`[DIALOG ALERT] ${dialog.message()}`);
      dialog.accept();
    });
    
    page.on('console', msg => console.log(`[BROWSER CONSOLE] ${msg.type()}: ${msg.text()}`));

    const roomsPage = new RoomsPage(page);

    // Generate unique names to prevent conflict if test runs multiple times
    const runId = Date.now().toString().slice(-4);
    const floorName = `Test Floor ${runId}`;
    const typeName = `Suite ${runId}`;
    const roomNumber = `S-${runId}`;

    // 1. Create Floor
    await roomsPage.createFloor(floorName, '2');
    await expect(page).toHaveURL(/settings\/inventory/);

    // 2. Create Room Type
    await roomsPage.createRoomType(typeName, '4', '5000');
    await expect(page).toHaveURL(/settings\/inventory/);

    // 3. Create Room
    await roomsPage.createRoom(roomNumber, floorName, typeName);
    await expect(page).toHaveURL(/settings\/inventory/);

    // 4. Navigate to operational dashboard and verify room appears
    await roomsPage.goto();
    
    // Room should appear in the rooms dashboard as a card or table row
    const roomCard = page.locator('tr, [class*="rounded-xl"]').filter({ hasText: roomNumber });
    await expect(roomCard.first()).toBeVisible({ timeout: 10000 });
    await expect(roomCard.first()).toContainText(typeName);
    await expect(roomCard.first()).toContainText(/available/i);
  });

  test('Settings pages are accessible from dashboard rooms view', async ({ page }) => {
    // Go to rooms dashboard
    await page.goto('/dashboard/rooms');
    await page.waitForLoadState('networkidle');

    // Verify links to settings pages exist (now just Property Inventory)
    const manageInventoryLink = page.getByRole('link', { name: /Property Inventory|Manage Inventory|Inventory/i });

    // Ensure the link is present
    await expect(manageInventoryLink.first()).toBeVisible({ timeout: 5000 });
  });

});
