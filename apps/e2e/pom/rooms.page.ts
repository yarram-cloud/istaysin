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
    await this.page.goto('/dashboard/settings/inventory');
    await this.page.waitForLoadState('networkidle');

    // Make sure the floor section is open (it is by default, but wait for 'Add Floor' button)
    const addFloorBtn = this.page.getByRole('button', { name: /Add Floor/i });
    await addFloorBtn.waitFor({ state: 'visible' });
    await addFloorBtn.click();

    const nameInput = this.page.getByPlaceholder('e.g. Ground Floor');
    await nameInput.waitFor({ state: 'visible' });
    await nameInput.fill(name);

    // Fill sort order / level
    const levelInput = this.page.getByPlaceholder('Level');
    if (await levelInput.isVisible()) {
      await levelInput.fill(level);
    }

    await Promise.all([
      this.page.waitForResponse(r => r.url().includes('rooms/floors') && r.request().method() === 'POST'),
      this.page.getByRole('button', { name: /Save/i }).first().click()
    ]);

    await this.page.waitForTimeout(1000);
  }

  // ── Room Types ──

  async createRoomType(name: string, maxGuests: string, rate: string) {
    await this.page.goto('/dashboard/settings/inventory');
    await this.page.waitForLoadState('networkidle');

    const addRoomTypeBtn = this.page.getByRole('button', { name: /Add Room Type/i });
    await addRoomTypeBtn.waitFor({ state: 'visible' });
    await addRoomTypeBtn.click();

    const nameInput = this.page.getByPlaceholder('Room type name');
    await nameInput.waitFor({ state: 'visible' });
    await nameInput.fill(name);

    // Fill max occupancy
    const guestsInput = this.page.getByPlaceholder('Max guests');
    await guestsInput.fill(maxGuests);

    // Fill base rate
    const rateInput = this.page.getByPlaceholder('Rate');
    await rateInput.fill(rate);

    await Promise.all([
      this.page.waitForResponse(r => r.url().includes('rooms/types') && r.request().method() === 'POST'),
      this.page.getByRole('button', { name: /Save/i }).nth(1).click() // second save button is for types
    ]);

    await this.page.waitForTimeout(1000);
  }

  // ── Rooms ──

  async createRoom(number: string, floorName: string, typeName: string, overrideRate?: string) {
    await this.page.goto('/dashboard/settings/inventory');
    await this.page.waitForLoadState('networkidle');

    const addRoomBtn = this.page.getByRole('button', { name: /Add Room/i });
    await addRoomBtn.waitFor({ state: 'visible' });
    await addRoomBtn.click();

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
      // no rate override on inline form yet, skipping or could implement in future
    }

    await Promise.all([
      this.page.waitForResponse(r => r.url().includes('/rooms') && r.request().method() === 'POST' && !r.url().includes('types') && !r.url().includes('floors')),
      this.page.getByRole('button', { name: /Add/i }).last().click()
    ]);

    await this.page.waitForTimeout(1000);
  }
}
