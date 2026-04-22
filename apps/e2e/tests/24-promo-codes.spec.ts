import { test, expect } from '@playwright/test';

const PROPERTY_SLUG = 'suma1';
const ADMIN_EMAIL = 'owner@suma1.com';
const ADMIN_PASSWORD = 'password123';

test.describe('Promo Code & Coupon Engine', () => {
  const promoCode = `TESTPROMO${Math.floor(Math.random() * 1000)}`;

  test('Create and manage a coupon in dashboard', async ({ page }) => {
    // 1. Login to dashboard
    await page.goto('/login');
    await page.fill('input[type="email"]', ADMIN_EMAIL);
    await page.fill('input[type="password"]', ADMIN_PASSWORD);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/dashboard');

    // 2. Navigate to Coupons
    await page.click('a[href="/dashboard/coupons"]');
    await expect(page.locator('h1')).toContainText('Coupons & Promo Codes');

    // 3. Create a coupon
    await page.click('button:has-text("Create Coupon")');
    await page.fill('input[placeholder="e.g. SUMMER25"]', promoCode);
    await page.selectOption('select:has-text("Percentage")', 'percentage');
    await page.fill('input[placeholder="e.g. 15"]', '20');
    await page.fill('input[placeholder="Leave blank for unlimited"]', '10');
    await page.fill('input[value="0"]', '100'); // Min booking amount
    
    // Select a room type if available (optional in test if none)
    const roomTypeCheckbox = page.locator('input[type="checkbox"]').first();
    if (await roomTypeCheckbox.isVisible()) {
      await roomTypeCheckbox.check();
    }

    await page.click('button:has-text("Create Coupon")');
    
    // 4. Verify coupon exists
    await expect(page.locator('h3')).toContainText(promoCode);
    await expect(page.locator('p')).toContainText('20%');
  });

  test('Apply promo code in IBE checkout', async ({ page }) => {
    // 1. Go to IBE
    await page.goto(`/en/${PROPERTY_SLUG}/book`);
    
    // 2. Check availability
    await page.click('button:has-text("Check Availability")');
    await expect(page.locator('button:has-text("Proceed to Guest Details")')).toBeVisible();
    await page.click('button:has-text("Proceed to Guest Details")');

    // 3. Fill Guest Details
    await page.locator('input[placeholder="John Doe"]').fill('Test Guest');
    await page.locator('input[placeholder="john@example.com"]').fill('test@example.com');
    await page.locator('input[placeholder="+91 9999999999"]').fill('9876543210');
    await page.selectOption('select', { index: 1 });

    // 4. Test Invalid Promo Code
    await page.fill('input[placeholder="ENTER CODE"]', 'INVALID_CODE_123');
    await page.click('button:has-text("Apply")');
    await expect(page.locator('text=Invalid promo code')).toBeVisible();

    // 5. Apply valid Promo Code
    await page.fill('input[placeholder="ENTER CODE"]', promoCode);
    await page.click('button:has-text("Apply")');

    // 6. Verify Discount Applied
    await expect(page.locator('text=saved')).toBeVisible();
    await expect(page.locator('text=Discount')).toBeVisible();
    
    // 7. Complete Booking
    await page.click('button:has-text("Confirm Reservation")');
    await expect(page.locator('h2')).toContainText('Confirmed');
  });
});
