# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: apps\e2e\tests\05-guest-booking.spec.ts >> Public Guest Booking Flow >> Guest can search availability and confirm a reservation
- Location: apps\e2e\tests\05-guest-booking.spec.ts:11:7

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.selectOption: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('select').first()

```

# Page snapshot

```yaml
- generic [ref=e1]:
  - generic [ref=e2]:
    - banner [ref=e3]:
      - generic [ref=e4]:
        - generic [ref=e5]:
          - generic [ref=e6]: P
          - heading "Premium Resort Pro" [level=1] [ref=e8]
        - navigation [ref=e9]:
          - link "About" [ref=e10] [cursor=pointer]:
            - /url: "#about"
          - link "Rooms" [ref=e11] [cursor=pointer]:
            - /url: "#rooms"
          - link "Amenities" [ref=e12] [cursor=pointer]:
            - /url: "#amenities"
          - link "Reviews" [ref=e13] [cursor=pointer]:
            - /url: "#reviews"
        - link "Book Now" [ref=e14] [cursor=pointer]:
          - /url: /en/premium-resort-pro/book
    - main [ref=e15]:
      - main [ref=e17]:
        - generic [ref=e19]:
          - generic [ref=e21]: Premium Resort Pro
          - navigation [ref=e22]:
            - link "About" [ref=e23] [cursor=pointer]:
              - /url: "#about"
            - link "Rooms" [ref=e24] [cursor=pointer]:
              - /url: "#rooms"
            - link "Gallery" [ref=e25] [cursor=pointer]:
              - /url: "#gallery"
          - generic [ref=e26]:
            - link "Book Now" [ref=e27] [cursor=pointer]:
              - /url: /en/premium-resort-pro/book
            - button "Switch language" [ref=e29] [cursor=pointer]:
              - img [ref=e30]
              - generic [ref=e33]: English
        - generic [ref=e36]:
          - heading "Welcome to Premium Resort Pro" [level=1] [ref=e37]
          - paragraph
          - button "Book Now" [ref=e38] [cursor=pointer]
        - generic [ref=e46]:
          - generic [ref=e47]: Best Price Guarantee
          - generic [ref=e48]:
            - heading "Book Your Stay" [level=3] [ref=e49]
            - paragraph [ref=e50]: Select dates to view available prices.
          - generic [ref=e51]:
            - generic [ref=e52]:
              - generic [ref=e53] [cursor=pointer]:
                - generic [ref=e54]: Check In
                - generic [ref=e55]:
                  - img [ref=e56]
                  - textbox [ref=e58]: 2026-04-22
              - generic [ref=e60] [cursor=pointer]:
                - generic [ref=e61]: Check Out
                - textbox [active] [ref=e63]: 2026-04-23
            - generic [ref=e65] [cursor=pointer]:
              - generic [ref=e66]: Guests & Rooms
              - generic [ref=e67]:
                - generic [ref=e68]:
                  - img [ref=e69]
                  - generic [ref=e74]: 2 Guests, 1 Room
                - img [ref=e75]
            - button "Check Availability" [ref=e77] [cursor=pointer]
          - generic [ref=e79]:
            - img [ref=e80]
            - generic [ref=e83]: No hidden fees
            - img [ref=e85]
            - generic [ref=e88]: Instant Confirmation
    - contentinfo [ref=e89]:
      - generic [ref=e90]:
        - generic [ref=e91]:
          - heading "Premium Resort Pro" [level=3] [ref=e92]
          - paragraph [ref=e93]: ", ,"
          - paragraph [ref=e94]: 📞
          - paragraph [ref=e95]: ✉️
        - generic [ref=e96]:
          - heading "Quick Links" [level=3] [ref=e97]
          - list [ref=e98]:
            - listitem [ref=e99]:
              - link "Our Rooms" [ref=e100] [cursor=pointer]:
                - /url: "#rooms"
            - listitem [ref=e101]:
              - link "Guest Reviews" [ref=e102] [cursor=pointer]:
                - /url: "#reviews"
            - listitem [ref=e103]:
              - link "Terms & Conditions" [ref=e104] [cursor=pointer]:
                - /url: /terms
            - listitem [ref=e105]:
              - link "Privacy Policy" [ref=e106] [cursor=pointer]:
                - /url: /privacy
        - heading "Connect With Us" [level=3] [ref=e108]
      - generic [ref=e109]:
        - text: © 2026 Premium Resort Pro. All rights reserved.
        - generic [ref=e110]: Powered by iStays
  - alert [ref=e111]
```

# Test source

```ts
  1   | import { Page, Locator, expect } from '@playwright/test';
  2   | 
  3   | export class GuestBookingPage {
  4   |   readonly page: Page;
  5   |   
  6   |   // Public Landing / Widget
  7   |   readonly publicWidgetCheckIn: Locator;
  8   |   readonly publicWidgetCheckOut: Locator;
  9   |   readonly publicWidgetGuests: Locator;
  10  |   readonly publicWidgetSearchBtn: Locator;
  11  | 
  12  |   // Checkout Page - Step 1: Search
  13  |   readonly checkInInput: Locator;
  14  |   readonly checkOutInput: Locator;
  15  |   readonly searchAvailabilityBtn: Locator;
  16  |   readonly roomTypeSelect: Locator;
  17  |   readonly proceedToGuestDetailsBtn: Locator;
  18  | 
  19  |   // Checkout Page - Step 2: Guest Details
  20  |   readonly fullNameInput: Locator;
  21  |   readonly emailInput: Locator;
  22  |   readonly phoneInput: Locator;
  23  |   readonly stateSelect: Locator;
  24  |   readonly confirmReservationBtn: Locator;
  25  | 
  26  |   // Checkout Page - Step 3: Success
  27  |   readonly bookingConfirmationHeading: Locator;
  28  | 
  29  |   constructor(page: Page) {
  30  |     this.page = page;
  31  | 
  32  |     // Public Widget
  33  |     this.publicWidgetCheckIn = page.locator('input[type="date"]').first();
  34  |     this.publicWidgetCheckOut = page.locator('input[type="date"]').nth(1);
  35  |     this.publicWidgetGuests = page.locator('select').first();
  36  |     this.publicWidgetSearchBtn = page.getByRole('button', { name: 'Check Availability', exact: false });
  37  | 
  38  |     // Step 1
  39  |     this.checkInInput = page.locator('input[type="date"]').first(); // On /book
  40  |     this.checkOutInput = page.locator('input[type="date"]').nth(1);
  41  |     this.roomTypeSelect = page.locator('select').last();
  42  |     this.searchAvailabilityBtn = page.getByRole('button', { name: 'Check Availability' });
  43  |     this.proceedToGuestDetailsBtn = page.getByRole('button', { name: 'Proceed to Guest Details' });
  44  | 
  45  |     // Step 2
  46  |     this.fullNameInput = page.locator('input[type="text"]').first();
  47  |     this.emailInput = page.locator('input[type="email"]');
  48  |     this.phoneInput = page.locator('input[type="tel"]');
  49  |     this.stateSelect = page.locator('select').filter({ hasText: 'Select State' });
  50  |     this.confirmReservationBtn = page.getByRole('button', { name: 'Confirm Reservation' });
  51  | 
  52  |     // Step 3
  53  |     this.bookingConfirmationHeading = page.getByText('You\'re All Set!');
  54  |   }
  55  | 
  56  |   async gotoPublicProperty(slug: string) {
  57  |     await this.page.goto(`http://localhost:3100/en/${slug}`, { timeout: 90000 });
  58  |   }
  59  | 
  60  |   async fillPublicWidgetAndSearch(checkIn: string, checkOut: string, guests: string = '2') {
  61  |     await expect(this.publicWidgetCheckIn).toBeVisible();
  62  |     await this.publicWidgetCheckIn.fill(checkIn);
  63  |     await this.publicWidgetCheckOut.fill(checkOut);
> 64  |     await this.publicWidgetGuests.selectOption(guests);
      |                                   ^ Error: locator.selectOption: Test timeout of 30000ms exceeded.
  65  |     await this.publicWidgetSearchBtn.click();
  66  |     await this.page.waitForURL(/.*\/book\?.*/);
  67  |   }
  68  | 
  69  |   async checkAvailability() {
  70  |     await expect(this.searchAvailabilityBtn).toBeVisible();
  71  |     // Wait for API response
  72  |     const responsePromise = this.page.waitForResponse(response => 
  73  |       response.url().includes('/api/v1/public/check-availability') && response.status() === 200
  74  |     );
  75  |     await this.searchAvailabilityBtn.click();
  76  |     await responsePromise;
  77  |   }
  78  | 
  79  |   async proceedToGuestDetails() {
  80  |     await expect(this.proceedToGuestDetailsBtn).toBeVisible();
  81  |     await this.proceedToGuestDetailsBtn.click();
  82  |   }
  83  | 
  84  |   async fillGuestDetailsAndConfirm(name: string, email: string, phone: string, state: string) {
  85  |     await this.fullNameInput.fill(name);
  86  |     await this.emailInput.fill(email);
  87  |     await this.phoneInput.fill(phone);
  88  |     await this.stateSelect.selectOption(state);
  89  |     const responsePromise = this.page.waitForResponse(response => 
  90  |       response.url().includes('/api/v1/public/bookings')
  91  |     );
  92  |     await this.confirmReservationBtn.click();
  93  |     const response = await responsePromise;
  94  |     if (response.status() !== 200) {
  95  |       const errorBody = await response.json().catch(() => ({}));
  96  |       throw new Error(`Booking API Failed with status ${response.status()}: ${JSON.stringify(errorBody)}`);
  97  |     }
  98  |     expect(response.status()).toBe(200);
  99  |   }
  100 | 
  101 |   async assertConfirmationSuccess() {
  102 |     await expect(this.bookingConfirmationHeading).toBeVisible();
  103 |   }
  104 | }
  105 | 
```