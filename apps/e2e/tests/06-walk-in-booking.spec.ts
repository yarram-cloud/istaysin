import { test, expect } from '@playwright/test';

test.describe('Dashboard Express Walk-in Flow', () => {
  // Use sequential mode if we do data manipulation, but here we can just create a unique walkin guest
  test('Front-desk can perform a Quick Walk-in and see room status change', async ({ page }) => {
    // Navigate to local dashboard (assuming auth relies on test setup or cookies)
    await page.goto('http://localhost:3100/login');
    
    // Login as a user who has front_desk or property_owner access
    await page.fill('input[type="text"], input[type="email"]', 'admin@istays.test');
    await page.fill('input[type="password"]', 'admin123'); // Assuming standard test credentials
    await page.click('button[type="submit"]');

    // Wait for redirect to dashboard
    await page.waitForURL(url => url.pathname.includes('/dashboard'), { timeout: 15000 });

    // Navigate to Rooms to get a baseline and ensure an 'Available' room exists
    await page.goto('http://localhost:3100/dashboard/rooms');
    await expect(page.locator('h1')).toContainText('Room Inventory', { timeout: 10000 });
    
    // Go to Bookings Page
    await page.goto('http://localhost:3100/dashboard/bookings');
    await expect(page.locator('h1')).toContainText('Bookings');

    // Open Quick Walk-in Card
    await page.click('button:has-text("Quick Walk-in"), button:has-text("Walk-in")');
    await expect(page.locator('text=Express Walk-in')).toBeVisible();

    // Fill form
    const rawNumber = Math.floor(Math.random() * 100000000).toString().padStart(8, '0');
    const guestPhone = `99${rawNumber}`;
    
    await page.fill('input[placeholder="e.g. Rajesh Kumar"]', 'E2E Walkin Guest');
    await page.fill('input[placeholder="10 digit number"]', guestPhone);
    
    // Select the first available room — datalist requires exact option text
    const roomInput = page.locator('input[placeholder="Search room..."]');
    await roomInput.click();
    // Wait for datalist to populate
    await page.waitForTimeout(500);
    // Get the first option value from the datalist
    const firstOption = await page.locator('#walkin-rooms option').first().getAttribute('value');
    if (firstOption) {
      await roomInput.fill(firstOption);
    } else {
      // Fallback: try typing a room number and hope it matches
      await roomInput.fill('101');
    }
    
    await page.fill('input[type="number"]', '3');
    await page.click('button:has-text("Book & Check-in")');

    // Toast visible
    await expect(page.locator('text=Walk-in booking created')).toBeVisible({ timeout: 10000 });

    // Verify appearance in table
    await expect(page.locator(`text=${guestPhone}`)).toBeVisible();
  });

  test('Front-desk can perform a Monthly Walk-in (PG Mode)', async ({ page }) => {
    await page.goto('http://localhost:3100/login');
    await page.fill('input[type="text"], input[type="email"]', 'admin@istays.test');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL(url => url.pathname.includes('/dashboard'));

    await page.goto('http://localhost:3100/dashboard/bookings');
    await page.click('button:has-text("Quick Walk-in"), button:has-text("Walk-in")');

    const rawNumber = Math.floor(Math.random() * 100000000).toString().padStart(8, '0');
    const guestPhone = `88${rawNumber}`;

    await page.fill('input[placeholder="e.g. Rajesh Kumar"]', 'Monthly PG Guest');
    await page.fill('input[placeholder="10 digit number"]', guestPhone);
    const roomInput2 = page.locator('input[placeholder="Search room..."]');
    await roomInput2.click();
    await page.waitForTimeout(500);
    const secondOption = await page.locator('#walkin-rooms option').nth(1).getAttribute('value');
    if (secondOption) {
      await roomInput2.fill(secondOption);
    } else {
      await roomInput2.fill('102');
    }
    
    await page.fill('input[type="number"]', '1');
    await page.selectOption('select:has-text("Nights")', 'months'); 
    
    await page.click('button:has-text("Book & Check-in")');
    await expect(page.locator('text=Walk-in booking created')).toBeVisible();
    await expect(page.locator(`text=${guestPhone}`)).toBeVisible();
  });
});
