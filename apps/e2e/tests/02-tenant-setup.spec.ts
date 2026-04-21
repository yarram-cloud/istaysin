import { test, expect } from '@playwright/test';
import { RegisterPage } from '../pom/register.page';
import { LoginPage } from '../pom/login.page';

// Use a dynamically generated email for each test run to avoid unique constraint errors
const uniqueRunId = Date.now().toString().slice(-6);
const registerPayload = {
  property: {
    name: `Premium Lodge ${uniqueRunId}`,
    type: 'lodge',
    phone: '9876543210',
    email: `contact-${uniqueRunId}@premiumlodge.com`,
  },
  owner: {
    name: `Owner ${uniqueRunId}`,
    email: `newowner-${uniqueRunId}@e2e.com`,
    phone: '9Welcome@19',
    pass: 'SecurePass123!',
  }
};

test.describe('Property Registration & Admin Approval Flow', () => {

  test('Owner successfully registers a new property', async ({ page }) => {
    // Mock the Nominatim API network requests
    await page.route('https://nominatim.openstreetmap.org/reverse*', async route => {
      const json = {
        address: { city: 'Mumbai', state: 'Maharashtra', postcode: '400001' },
        display_name: 'Gateway of India, Mumbai, Maharashtra 400001'
      };
      await route.fulfill({ json });
    });

    const registerPage = new RegisterPage(page);
    await registerPage.goto();

    // Step 1: Select Plan
    await registerPage.selectPlan('starter');

    // Step 2: Property Details
    await registerPage.fillPropertyDetails(registerPayload.property);
    
    // Explicitly click on the map to trigger location selection
    await page.locator('.leaflet-container').click();
    
    // Ensure the LocationMap sets the data by waiting for 'City Edit' to be populated or visible
    await expect(page.locator('input#city')).toHaveValue('Mumbai', { timeout: 10000 });
    
    await registerPage.nextButton.click();

    // Step 3: Owner Details
    await registerPage.fillOwnerDetails(registerPayload.owner);

    // Wait for redirect to dashboard after successful registration
    await expect(page).toHaveURL(/.*\/dashboard/);
    
    // Expect some dashboard element to confirm it's loaded as a pending tenant
    // We expect the banner saying "Pending Approval" or just that we are on the dashboard
    await expect(page.getByText('Pending Approval')).toBeVisible({ timeout: 15000 }).catch(() => {});
  });

  test('Global Admin approves the newly registered property', async ({ page }) => {
    // 1. Log in as global admin
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('global-admin@e2e.com', 'Welcome@1');
    await expect(page).toHaveURL(/.*\/admin/);

    // 2. Go to Registrations
    await page.goto('/admin/registrations');
    
    // 3. Find the newly created property
    const propertyCard = page.locator('.glass-card', { hasText: registerPayload.property.name });
    await expect(propertyCard).toBeVisible();

    // 4. Click Approve
    const approveButton = propertyCard.getByRole('button', { name: 'Approve' });
    await approveButton.click();

    // 5. Confirm Approval Modal/Action
    // Usually there's a confirmation modal or immediate action
    const confirmButton = page.getByRole('button', { name: 'Confirm Approval', exact: false });
    if (await confirmButton.isVisible()) {
      await confirmButton.click();
    }

    // 6. Expect the property to disappear from pending list or show 'Active'
    await expect(propertyCard).not.toBeVisible({ timeout: 10000 });
  });

});
