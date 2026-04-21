import { Page, Locator } from '@playwright/test';

export class RoomsPage {
  readonly page: Page;

  // Actions
  readonly addFloorButton: Locator;
  readonly addRoomTypeButton: Locator;
  readonly addRoomButton: Locator;

  // Modals
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
    this.addRoomTypeButton = page.getByRole('button', { name: /Room Types/i }).first();
    this.addRoomButton = page.getByRole('button', { name: /Add Room/i }).first();

    // Modals
    this.modalTitle = page.locator('h2');
    
    // Manage Floors Page
    this.floorNameInput = page.getByPlaceholder('Floor name');
    this.floorLevelInput = page.getByPlaceholder('Level');
    // The button says "Add Floor"
    this.saveFloorButton = page.getByRole('button', { name: /Add Floor|Add/i }); 

    // Manage Room Types Page
    this.typeNameInput = page.getByPlaceholder('Type name');
    this.typeGuestsInput = page.locator('input[type="number"]').first();
    this.typeRateInput = page.locator('input[type="number"]').nth(1);
    this.saveTypeButton = page.getByRole('button', { name: /Add Room Type|Add Type/i });

    // Manage Rooms Form
    this.roomNumberInput = page.getByPlaceholder('e.g. 101, A-201');
    this.roomFloorSelect = page.locator('select').first();
    this.roomTypeSelect = page.locator('select').nth(1);
    this.roomRateInput = page.getByPlaceholder('Auto from room type');
    this.saveRoomButton = page.getByRole('button', { name: /Add Room|Update/i }).last();
  }

  async goto() {
    await this.page.goto('/dashboard/rooms');
  }

  async createFloor(name: string, level: string) {
    await this.addFloorButton.click();
    await this.page.waitForURL(/.*\/dashboard\/rooms\/floors/);
    await this.floorNameInput.fill(name);
    await this.floorLevelInput.fill(level);
    
    await Promise.all([
      this.page.waitForResponse(r => r.url().includes('rooms/floors') && r.request().method() === 'POST'),
      this.saveFloorButton.click()
    ]);
    
    await this.goto();
    await this.page.waitForTimeout(1000);
  }

  async createRoomType(name: string, maxGuests: string, rate: string) {
    await this.addRoomTypeButton.click();
    await this.page.waitForURL(/.*\/dashboard\/rooms\/types/);
    await this.typeNameInput.fill(name);
    await this.typeGuestsInput.fill(maxGuests);
    await this.typeRateInput.fill(rate);
    
    await Promise.all([
      this.page.waitForResponse(r => r.url().includes('rooms/types') && r.request().method() === 'POST'),
      this.saveTypeButton.click()
    ]);

    await this.goto();
    await this.page.waitForTimeout(1000);
  }

  async createRoom(number: string, floorName: string, typeName: string, overrideRate?: string) {
    await this.addRoomButton.click();
    await this.page.waitForURL(/.*\/dashboard\/rooms\/new/);
    await this.roomNumberInput.fill(number);
    const floorVal = await this.roomFloorSelect.locator(`option:has-text("${floorName}")`).getAttribute('value');
    if (floorVal) await this.roomFloorSelect.selectOption(floorVal);

    const typeVal = await this.roomTypeSelect.locator(`option:has-text("${typeName}")`).getAttribute('value');
    if (typeVal) await this.roomTypeSelect.selectOption(typeVal);
    if (overrideRate) {
      await this.roomRateInput.fill(overrideRate);
    }
    await this.saveRoomButton.click();
    await this.page.waitForURL(/.*\/dashboard\/rooms/);
  }
}
