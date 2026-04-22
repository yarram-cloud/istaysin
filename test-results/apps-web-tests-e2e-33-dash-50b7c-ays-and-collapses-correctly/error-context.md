# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: apps\web\tests\e2e\33-dashboard-ui-rooms.spec.ts >> Dashboard UI & Rooms Modals E2E >> Dashboard Sidebar navigation displays and collapses correctly
- Location: apps\web\tests\e2e\33-dashboard-ui-rooms.spec.ts:16:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('button', { name: 'Log out' })
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByRole('button', { name: 'Log out' })

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e4]:
    - generic [ref=e5]:
      - link "istaysin" [ref=e6] [cursor=pointer]:
        - /url: /
        - img [ref=e7]
        - generic [ref=e11]: istaysin
      - heading "Welcome back" [level=1] [ref=e12]
      - paragraph [ref=e13]: Sign in to manage your property
    - generic [ref=e14]:
      - generic [ref=e15]:
        - generic [ref=e16]: Email
        - textbox "Email" [ref=e17]:
          - /placeholder: you@example.com
      - generic [ref=e18]:
        - generic [ref=e19]: Password
        - generic [ref=e20]:
          - textbox "Password" [ref=e21]:
            - /placeholder: ••••••••
          - button [ref=e22] [cursor=pointer]:
            - img [ref=e23]
      - generic [ref=e26]:
        - generic [ref=e27]:
          - checkbox "Remember me" [ref=e28]
          - text: Remember me
        - link "Forgot password?" [ref=e29] [cursor=pointer]:
          - /url: /forgot-password
      - button "Sign In" [ref=e30] [cursor=pointer]
    - paragraph [ref=e31]:
      - text: Don't have an account?
      - link "Create one" [ref=e32] [cursor=pointer]:
        - /url: /register
  - alert [ref=e33]
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
> 21  |     await expect(page.getByRole('button', { name: 'Log out' })).toBeVisible();
      |                                                                 ^ Error: expect(locator).toBeVisible() failed
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
  60  |     await page.goto(`${BROWSER_URL}/dashboard/rooms`);
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