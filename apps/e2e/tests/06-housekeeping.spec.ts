import { test, expect } from '@playwright/test';
import { LoginPage } from '../pom/login.page';
import { HousekeepingPage } from '../pom/housekeeping.page';

test.describe('Housekeeping Operations', () => {
  let loginPage: LoginPage;
  let housekeepingPage: HousekeepingPage;

  test.beforeEach(async ({ page, request }) => {
    loginPage = new LoginPage(page);
    housekeepingPage = new HousekeepingPage(page);

    // Context: Use 'premium-resort-pro' configured in global-setup
    // Login as Admin
    await loginPage.goto();
    await loginPage.login('owner-premium@e2e.com', 'Welcome@1');

    // Mock an explicit check-out state which generates a housekeeping task for Room 101.
    const tokenRes = await page.evaluate(() => localStorage.getItem('accessToken'));

    // Fetch rooms to get a roomId
    const roomRes = await request.get('/api/v1/rooms', {
      headers: { 'Authorization': `Bearer ${tokenRes}` }
    });
    const roomsData = await roomRes.json();
    const roomId = roomsData.data[0].id;

    // Inject a pending cleaning task via API to test the UI transitions smoothly
    await request.post('/api/v1/housekeeping/tasks', {
      headers: { 'Authorization': `Bearer ${tokenRes}` },
      data: {
        roomId: roomId,
        taskType: 'cleaning',
        priority: 'high',
        notes: 'E2E Testing Task Generation'
      }
    });

  });

  test('Transition Housekeeping Task Status through full lifecycle', async () => {
    // 1. Traverse to Housekeeping Dashboard
    await housekeepingPage.goto('premium-resort-pro');

    // 2. Mark Room 101 from Pending to In Progress
    await housekeepingPage.updateTaskStatus('101', 'in_progress');
    await housekeepingPage.assertRoomStatus('101', 'in_progress');

    // 3. Mark from In Progress to Completed
    await housekeepingPage.updateTaskStatus('101', 'completed');
    await housekeepingPage.assertRoomStatus('101', 'completed');

    // 4. Inspect the room and close the loop
    await housekeepingPage.updateTaskStatus('101', 'inspected');
    await housekeepingPage.assertRoomStatus('101', 'inspected');
  });
});
