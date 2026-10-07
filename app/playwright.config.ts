import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'e2e',
  timeout: 60_000,
  retries: 0,
  use: {
    baseURL: process.env.BASE_URL ?? 'http://localhost:3123',
    launchOptions: { executablePath: process.env.CHROMIUM_PATH || undefined },
    screenshot: 'only-on-failure',
    locale: 'en-US',
    timezoneId: 'America/New_York'
  },
  reporter: [['list']]
});
