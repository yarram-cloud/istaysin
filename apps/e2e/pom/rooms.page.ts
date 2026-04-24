import { Page, Locator } from '@playwright/test';

export class RoomsPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto() {
    await this.page.goto('/dashboard/rooms');
  }

  // ── Floors ──

  async createFloor(name: string, level: string) {
    // Navigate to floors settings page
    await this.page.goto('/dashboard/settings/floors/new');
    await this.page.waitForLoadState('networkidle');

    const nameInput = this.page.getByPlaceholder('e.g. Ground Floor');
    await nameInput.waitFor({ state: 'visible' });
    await nameInput.fill(name);

    // Fill sort order / level
    const levelInput = this.page.locator('input[type="number"]').first();
    if (await levelInput.isVisible()) {
      await levelInput.fill(level);
    }

    await Promise.all([
      this.page.waitForResponse(r => r.url().includes('rooms/floors') && r.request().method() === 'POST'),
      this.page.getByRole('button', { name: /Create Floor|Add Floor|Save/i }).click()
    ]);

    await this.page.waitForTimeout(1000);
  }

  // ── Room Types ──

  async createRoomType(name: string, maxGuests: string, rate: string) {
    // Navigate to room types settings page
    await this.page.goto('/dashboard/settings/room-types/new');
    await this.page.waitForLoadState('networkidle');

    const nameInput = this.page.getByPlaceholder('e.g. Deluxe Suite');
    await nameInput.waitFor({ state: 'visible' });
    await nameInput.fill(name);

    // Fill max occupancy
    const guestsInput = this.page.locator('input[type="number"]').first();
    await guestsInput.fill(maxGuests);

    // Fill base rate
    const rateInput = this.page.locator('input[type="number"]').nth(1);
    await rateInput.fill(rate);

    await Promise.all([
      this.page.waitForResponse(r => r.url().includes('rooms/types') && r.request().method() === 'POST'),
      this.page.getByRole('button', { name: /Create Room Type|Add Type|Save/i }).click()
    ]);

    await this.page.waitForTimeout(1000);
  }

  // ── Rooms ──

  async createRoom(number: string, floorName: string, typeName: string, overrideRate?: string) {
    // Navigate to new room page
    await this.page.goto('/dashboard/settings/inventory-rooms/new');
    await this.page.waitForLoadState('networkidle');

    const roomNumberInput = this.page.getByPlaceholder('e.g. 101');
    await roomNumberInput.waitFor({ state: 'visible' });
    await roomNumberInput.fill(number);

    // Select floor from dropdown
    const floorSelect = this.page.locator('select').first();
    const floorVal = await floorSelect.locator(`option:has-text("${floorName}")`).getAttribute('value');
    if (floorVal) await floorSelect.selectOption(floorVal);

    // Select room type from dropdown
    const typeSelect = this.page.locator('select').nth(1);
    const typeVal = await typeSelect.locator(`option:has-text("${typeName}")`).getAttribute('value');
    if (typeVal) await typeSelect.selectOption(typeVal);

    // Override rate if provided
    if (overrideRate) {
      const rateInput = this.page.locator('input[type="number"]').first();
      await rateInput.fill(overrideRate);
    }

    await Promise.all([
      this.page.waitForResponse(r => r.url().includes('/rooms') && r.request().method() === 'POST' && !r.url().includes('types') && !r.url().includes('floors')),
      this.page.getByRole('button', { name: /Create Room|Add Room|Save/i }).click()
    ]);

    await this.page.waitForTimeout(1000);
  }
}
