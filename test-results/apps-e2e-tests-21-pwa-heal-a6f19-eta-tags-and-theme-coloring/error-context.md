# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: apps\e2e\tests\21-pwa-health.spec.ts >> PWA Capabilities >> Layout should contain PWA meta tags and theme coloring
- Location: apps\e2e\tests\21-pwa-health.spec.ts:14:7

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.getAttribute: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('meta[name="theme-color"]')

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
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('PWA Capabilities', () => {
  4  |   test('Manifest should be available and valid', async ({ request }) => {
  5  |     const response = await request.get('http://localhost:3100/manifest.json');
  6  |     expect(response.ok()).toBeTruthy();
  7  |     
  8  |     const manifest = await response.json();
  9  |     expect(manifest.name).toBe('iStays Staff');
  10 |     expect(manifest.display).toBe('standalone');
  11 |     expect(manifest.icons.length).toBeGreaterThan(0);
  12 |   });
  13 | 
  14 |   test('Layout should contain PWA meta tags and theme coloring', async ({ page }) => {
  15 |     await page.goto('http://localhost:3100/login');
  16 |     
  17 |     // Check for viewport theme configuration matching Apple status bar specs
> 18 |     const themeColor = await page.locator('meta[name="theme-color"]').getAttribute('content');
     |                                                                       ^ Error: locator.getAttribute: Test timeout of 30000ms exceeded.
  19 |     expect(themeColor).toBe('#09090b');
  20 | 
  21 |     // Apple web app capability
  22 |     const appleCapable = await page.locator('meta[name="apple-mobile-web-app-capable"]').getAttribute('content');
  23 |     expect(appleCapable).toBe('yes');
  24 |   });
  25 | });
  26 | 
```