# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tests\e2e\33-dashboard-ui-rooms.spec.ts >> Dashboard UI & Rooms Modals E2E >> Rooms slide-out panels open and close with correct animations
- Location: tests\e2e\33-dashboard-ui-rooms.spec.ts:59:7

# Error details

```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3100/dashboard/rooms
Call log:
  - navigating to "http://localhost:3100/dashboard/rooms", waiting until "load"

```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | 
  3   | const BROWSER_URL = process.env.URL || 'http://localhost:3100';
  4   | 
  5   | test.describe('Dashboard UI & Rooms Modals E2E', () => {
  6   | 
  7   |   test.beforeEach(async ({ page }) => {
  8   |     // Inject mock auth token to bypass login directly to dashboard
  9   |     await page.addInitScript(() => {
  10  |       localStorage.setItem('accessToken', 'mock-valid-token');
  11  |       localStorage.setItem('user', JSON.stringify({ fullName: 'Staff User', role: 'admin' }));
  12  |       localStorage.setItem('tenantId', 'mock-tenant-id');
  13  |     });
  14  |   });
  15  | 
  16  |   test('Dashboard Sidebar navigation displays and collapses correctly', async ({ page, isMobile }) => {
  17  |     await page.goto(`${BROWSER_URL}/dashboard`);
  18  |     
  19  |     // Check elements exist
  20  |     await expect(page.getByRole('link', { name: 'istaysin' })).toBeVisible();
  21  |     await expect(page.getByRole('button', { name: 'Log out' })).toBeVisible();
  22  | 
  23  |     if (isMobile) {
  24  |       // Sidebar should be initially hidden on mobile
  25  |       const sidebar = page.locator('aside');
  26  |       await expect(sidebar).toHaveClass(/.*-translate-x-full.*/);
  27  | 
  28  |       // Open Sidebar
  29  |       await page.locator('button').locator('svg.lucide-menu').click();
  30  |       
  31  |       // Sidebar should transition in
  32  |       await expect(sidebar).toHaveClass(/.*translate-x-0.*/);
  33  | 
  34  |       // Verify category headings
  35  |       await expect(page.getByText('Management')).toBeVisible();
  36  |       await expect(page.getByText('Front Desk')).toBeVisible();
  37  |       
  38  |       // Verify new links
  39  |       await expect(page.getByRole('link', { name: 'Staff Shifts' })).toBeVisible();
  40  |       await expect(page.getByRole('link', { name: 'Channel Manager' })).toBeVisible();
  41  | 
  42  |       // Click "Rooms"
  43  |       await page.getByRole('link', { name: 'Rooms' }).click();
  44  | 
  45  |       // Sidebar should auto-close
  46  |       await expect(sidebar).toHaveClass(/.*-translate-x-full.*/);
  47  |       await expect(page).toHaveURL(/.*\/dashboard\/rooms/);
  48  |     } else {
  49  |       // Desktop Sidebar is always visible
  50  |       const sidebar = page.locator('aside');
  51  |       await expect(sidebar).toBeVisible();
  52  |       
  53  |       // Navigating
  54  |       await page.getByRole('link', { name: 'Rooms' }).click();
  55  |       await expect(page).toHaveURL(/.*\/dashboard\/rooms/);
  56  |     }
  57  |   });
  58  | 
  59  |   test('Rooms slide-out panels open and close with correct animations', async ({ page }) => {
> 60  |     await page.goto(`${BROWSER_URL}/dashboard/rooms`);
      |                ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3100/dashboard/rooms
  61  |     
  62  |     // Wait for initial load
  63  |     await expect(page.getByRole('heading', { name: 'Rooms', exact: true })).toBeVisible();
  64  | 
  65  |     // 1. Test "Manage Floors" panel
  66  |     await page.getByRole('button', { name: 'Floors' }).click();
  67  |     
  68  |     // Verify slide-out renders correctly over the backdrop
  69  |     const floorsPanel = page.getByRole('heading', { name: 'Manage Floors' });
  70  |     await expect(floorsPanel).toBeVisible();
  71  |     
  72  |     // Check UI aesthetic properties via classes matching our replacement
  73  |     const modalContainer = page.locator('.animate-slide-left');
  74  |     await expect(modalContainer).toBeVisible();
  75  |     await expect(modalContainer).toHaveClass(/.*bg-surface-950.*/);
  76  |     
  77  |     // Close using X
  78  |     await page.locator('.animate-slide-left button').locator('svg.lucide-x').click();
  79  |     await expect(floorsPanel).toBeHidden();
  80  | 
  81  |     // 2. Test "Manage Room Types" panel
  82  |     await page.getByRole('button', { name: 'Room Types' }).click();
  83  |     const typePanel = page.getByRole('heading', { name: 'Manage Room Types' });
  84  |     await expect(typePanel).toBeVisible();
  85  |     
  86  |     // Close by clicking backdrop
  87  |     await page.locator('.backdrop-blur-sm').click({ position: { x: 10, y: 10 } });
  88  |     await expect(typePanel).toBeHidden();
  89  | 
  90  |     // 3. Test "Add Room" panel
  91  |     await page.getByRole('button', { name: 'Add Room' }).click();
  92  |     const addRoomPanel = page.getByRole('heading', { name: 'Add Room' });
  93  |     await expect(addRoomPanel).toBeVisible();
  94  |     
  95  |     // Validate custom scrollbar hiding is applied gracefully to content section
  96  |     const contentBox = page.locator('.no-scrollbar').first();
  97  |     await expect(contentBox).toBeVisible();
  98  |     
  99  |     // Ensure the cancel button safely closes it
  100 |     await page.getByRole('button', { name: 'Cancel' }).click();
  101 |     await expect(addRoomPanel).toBeHidden();
  102 |   });
  103 | });
  104 | 
```