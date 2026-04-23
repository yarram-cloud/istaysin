import { Page, Locator } from '@playwright/test';

export class RoomsPage {
  readonly page: Page;

  // Actions
  readonly addFloorButton: Locator;
  readonly addRoomTypeButton: Locator;
  readonly addRoomButton: Locator;

  // Modals (now inline)
  readonly modalTitle: Locator;
  // Floor Modal
  readonly floorNameInput: Locator;
  readonly floorLevelInput: Locator;
  readonly saveFloorButton: Locator;
  // Room Type Modal
  readonly typeNameInput: Locator;
  readonly typeGuestsInput: Locator;
  readonly typeRateInput: Locator;
  readonly saveTypeButton: Locator;
  // Room Modal
  readonly roomNumberInput: Locator;
  readonly roomFloorSelect: Locator;
  readonly roomTypeSelect: Locator;
  readonly roomRateInput: Locator;
  readonly saveRoomButton: Locator;

  constructor(page: Page) {
    this.page = page;

    // Top action bar
    this.addFloorButton = page.getByRole('button', { name: /Floors/i }).first();
    this.addRoomTypeButton = page.getByRole('button', { name: /Types/i }).first();
    this.addRoomButton = page.getByRole('button', { name: /Add Room/i }).first();

    // Modals
    this.modalTitle = page.locator('h3');
    
    // Manage Floors Page
    this.floorNameInput = page.getByPlaceholder('e.g. Ground Floor');
    this.floorLevelInput = page.locator('input[type="number"]').first();
    // The button says "Add Floor"
    this.saveFloorButton = page.getByRole('button', { name: /Add Floor|Add/i }); 

    // Manage Room Types Page
    this.typeNameInput = page.getByPlaceholder('e.g. Deluxe Suite');
    this.typeGuestsInput = page.locator('input[type="number"]').first();
    this.typeRateInput = page.locator('input[type="number"]').nth(1);
    this.saveTypeButton = page.getByRole('button', { name: /Add Type/i });

    // Manage Rooms Form
    this.roomNumberInput = page.getByPlaceholder('e.g. 101');
    this.roomFloorSelect = page.locator('select').first();
    this.roomTypeSelect = page.locator('select').nth(1);
    this.roomRateInput = page.locator('input[type="number"]').first();
    this.saveRoomButton = page.getByRole('button', { name: /Create|Add Room/i }).last();
  }

  async goto() {
    await this.page.goto('/dashboard/rooms');
  }

  async createFloor(name: string, level: string) {
    await this.addFloorButton.click();
    await this.floorNameInput.waitFor({ state: 'visible' });
    await this.floorNameInput.fill(name);
    // await this.floorLevelInput.fill(level); // Removed because the new input has no empty state by default, it just defaults to max length, we can just save it or set it manually
    
    await Promise.all([
      this.page.waitForResponse(r => r.url().includes('rooms/floors') && r.request().method() === 'POST'),
      this.saveFloorButton.click()
    ]);
    
    await this.page.waitForTimeout(1000);
  }

  async createRoomType(name: string, maxGuests: string, rate: string) {
    await this.addRoomTypeButton.click();
    await this.typeNameInput.waitFor({ state: 'visible' });
    await this.typeNameInput.fill(name);
    await this.typeGuestsInput.fill(maxGuests);
    await this.typeRateInput.fill(rate);
    
    await Promise.all([
      this.page.waitForResponse(r => r.url().includes('rooms/types') && r.request().method() === 'POST'),
      this.saveTypeButton.click()
    ]);

    await this.page.waitForTimeout(1000);
  }

  async createRoom(number: string, floorName: string, typeName: string, overrideRate?: string) {
    await this.addRoomButton.click();
    await this.roomNumberInput.waitFor({ state: 'visible' });
    await this.roomNumberInput.fill(number);

    const floorVal = await this.roomFloorSelect.locator(`option:has-text("${floorName}")`).getAttribute('value');
    if (floorVal) await this.roomFloorSelect.selectOption(floorVal);

    // Re-evaluate roomType locator because we have 3 selects on the page actually: 
    // Top bar has 2 selects (Status Filter, Floor filter). Inline form has 2 selects (Floor, Room Type).
    // Let's use `getByLabel` or specific locators. But our POM is using `.first()` which might be brittle.
    // However, I'll let standard selectors run, but actually the inline form is at the bottom or top depending.
    // Better to just click Add Room which brings up the form.
    
    // Instead of brittleness:
    const floorSelects = await this.page.locator('select').all();
    for (const s of floorSelects) {
       const text = await s.textContent();
       if (text?.includes(floorName)) {
         await s.selectOption(floorVal!);
       }
       if (text?.includes(typeName)) {
         const typeVal = await s.locator(`option`, { hasText: typeName }).getAttribute('value');
         if (typeVal) await s.selectOption(typeVal);
       }
    }
    
    if (overrideRate) {
      await this.roomRateInput.fill(overrideRate);
    }
    await this.saveRoomButton.click();
    await this.page.waitForTimeout(1000);
  }
}
