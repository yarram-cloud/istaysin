import { defineConfig, devices } from '@playwright/test';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load env specific to tests if it exists, otherwise fallback to root .env
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const PORT = process.env.FRONTEND_PORT || 3100;
const BASE_URL = process.env.E2E_BASE_URL || `http://localhost:${PORT}`;

export default defineConfig({
  testDir: './tests',
  globalSetup: require.resolve('./global-setup'),
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : 1, // Standardized to 1 for database issues
  reporter: 'html',
  timeout: 120000,
  expect: { timeout: 30000 },
  
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
      },
    },
    {
      name: 'Mobile Chrome',
      use: {
        ...devices['Pixel 5'],
      },
    },
    {
      name: 'Mobile Safari',
      use: {
        ...devices['iPhone 12'],
      },
    },
  ],

  webServer: {
    command: 'npm run dev',
    cwd: path.resolve(__dirname, '../../'),
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
    env: {
      E2E_MODE: 'true',
    },
  },
});
