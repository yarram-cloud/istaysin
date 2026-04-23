import { test, expect } from '@playwright/test';

test.describe('Rate Comparison Widget', () => {
  // Mobile testing viewport
  test.use({ viewport: { width: 375, height: 667 } });

  test('should display rate comparison widget and savings on mobile', async ({ page }) => {
    // 1. Visit the booking page
    await page.goto('/en/blue-ocean-resort/book');

    // 2. Wait for API to load property and availability
    // Note: Depends on test DB having a tenant with slug 'blue-ocean-resort'
    // and rate comparison enabled. We will mock the API response here for resilience.
    await page.route('/api/v1/public/properties/blue-ocean-resort/rate-comparison', async route => {
      const json = {
        success: true,
        data: {
          enabled: true,
          rates: {
            // Assuming room type ID 'room_1' is selected first
            'cm0exv88m0000uxm884r21234': {
              'Booking.com': 4200,
              'MakeMyTrip': 4000
            }
          }
        }
      };
      await route.fulfill({ json });
    });

    // Mock availability so directRate is 3500
    await page.route('/api/v1/public/check-availability*', async route => {
      const json = {
        success: true,
        data: {
          available: true,
          pricing: {
            totalAmount: 3500,
            nightlyRates: [3500],
            totalGst: 420,
            grandTotal: 3920
          }
        }
      };
      await route.fulfill({ json });
    });

    // Setup property mock
    await page.route('/api/v1/public/properties/blue-ocean-resort', async route => {
      const json = {
        success: true,
        data: {
          id: 'tenant_1',
          name: 'Blue Ocean Resort',
          roomTypes: [{ id: 'cm0exv88m0000uxm884r21234', name: 'Deluxe Sea View', baseRate: 3500 }]
        }
      };
      await route.fulfill({ json });
    });

    // Go to booking page (with generic date params theoretically)
    await page.goto('/en/blue-ocean-resort/book');

    // Click check availability to simulate the pricing returning
    const checkBtn = page.locator('button:has-text("Check Availability")');
    await checkBtn.waitFor();
    await checkBtn.click();

    // Verify Rate Comparison Widget appears
    const widget = page.locator('text=Compare & Save');
    await widget.waitFor({ state: 'visible' });
    
    // Verify high competitor rate is shown
    await expect(page.locator('text=Booking.com')).toBeVisible();
    await expect(page.locator('text=4,200')).toBeVisible();

    // Verify Direct Price is shown
    await expect(page.locator('text=3,500')).toBeVisible();

    // Verify Savings calculation: 4200 - 3500 = 700
    await expect(page.locator('text=You save ₹700 per night!')).toBeVisible();

    // Expand "Why book direct?"
    await page.click('text=Why book direct?');
    await expect(page.locator('text=No hidden OTA commissions')).toBeVisible();
  });
});
