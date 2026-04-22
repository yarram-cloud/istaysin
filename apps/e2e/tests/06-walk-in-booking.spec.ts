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
    await page.waitForURL('**/dashboard');

    // Navigate to Rooms to get a baseline and ensure an 'Available' room exists
    await page.goto('http://localhost:3100/dashboard/rooms');
    // Ensure the page loads
    await expect(page.locator('text=Rooms')).toBeVisible({ timeout: 10000 });
    
    // Go to Bookings Page
    await page.goto('http://localhost:3100/dashboard/bookings');
    await expect(page.locator('h1:has-text("Bookings")')).toBeVisible();

    // Open Quick Walk-in Framer Card
    const walkInBtn = page.locator('button:has-text("Quick Walk-in")');
    await walkInBtn.click();
    
    // Wait for the inline card to expand (check for form elements)
    await expect(page.locator('text=Express Walk-in')).toBeVisible();

    // Fill form
    const guestPhone = `+9199${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`;
    
    await page.fill('input[placeholder="Full Name"]', 'E2E Walkin Guest');
    await page.fill('input[placeholder="+91..."]', guestPhone);
    
    // Select the first available room 
    const roomSelect = page.locator('select').nth(0);
    // Since we don't know the exact value, select by index > 0
    await roomSelect.selectOption({ index: 1 }); 
    
    // Duration
    await page.fill('input[type="number"]', '3'); // 3 days
    
    // Submit
    await page.click('button:has-text("Check In")');

    // Toast visible
    await expect(page.locator('text=Walk-in booking created')).toBeVisible();

    // Verify it appears in the grid with Checked In status
    await expect(page.locator(`text=${guestPhone}`)).toBeVisible();
    await expect(page.locator('td', { hasText: guestPhone }).locator('..').locator('text=Checked In')).toBeVisible();
  });
});
