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

  test('Owner can create floors, room types, and rooms successfully', async ({ page }) => {
    page.on('dialog', dialog => {
      console.log(`[DIALOG ALERT] ${dialog.message()}`);
      dialog.accept();
    });
    
    // Also log console messages:
    page.on('console', msg => console.log(`[BROWSER CONSOLE] ${msg.type()}: ${msg.text()}`));

    const roomsPage = new RoomsPage(page);
    await roomsPage.goto();

    // Generate unique names to prevent conflict if test runs multiple times
    const runId = Date.now().toString().slice(-4);
    const floorName = `Test Floor ${runId}`;
    const typeName = `Suite ${runId}`;
    const roomNumber = `S-${runId}`;

    // 1. Create Floor
    await roomsPage.createFloor(floorName, '2');
    
    // We expect the newly created floor to be somewhat verifiable, 
    // but the modal doesn't close immediately. Wait, in createFloor we press Escape.
    // So the modal should be closed. We can verify floor created by opening the modal again,
    // or just proceeding to create a room involving this floor.
    
    // 2. Create Room Type
    await roomsPage.createRoomType(typeName, '4', '5000');

    // 3. Create Room using newly created floor and type
    await roomsPage.createRoom(roomNumber, floorName, typeName);

    // 4. Verify room appears in the grid
    const roomCard = page.locator('.glass-card, .border').filter({ hasText: roomNumber });
    await expect(roomCard).toBeVisible({ timeout: 10000 });
    await expect(roomCard).toContainText(typeName);
    await expect(roomCard).toContainText(floorName);
    await expect(roomCard).toContainText(/available/i); // Default status
  });

});
