import { Page, Locator } from '@playwright/test';

export class HousekeepingPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto(slug: string) {
    await this.page.goto(`http://${slug}.istaysin.test:3100/dashboard/housekeeping`);
    await this.page.waitForLoadState('networkidle');
  }

  async updateTaskStatus(roomNumber: string, targetStatus: 'pending' | 'in_progress' | 'completed' | 'inspected') {
    // Locate the row containing the room number
    const row = this.page.locator(`tr:has-text("Room ${roomNumber}")`);
    await row.waitFor({ state: 'visible' });

    // Open the dropdown for Status
    await row.locator('button[aria-haspopup="menu"]').click();
    
    // Click the target status from dropdown
    await this.page.getByRole('menuitem', { name: targetStatus.replace('_', ' ') }).click();

    // Wait for the UI update
    await this.page.waitForTimeout(500); // give it time to patch the API locally
  }

  async assertRoomStatus(roomNumber: string, expectedStatus: string) {
    const row = this.page.locator(`tr:has-text("Room ${roomNumber}")`);
    // Check if the badge containing the status is visible inside the row
    await row.getByText(expectedStatus, { exact: false }).waitFor({ state: 'visible' });
  }
}
