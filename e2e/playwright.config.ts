import { defineConfig } from '@playwright/test';

const isVisualMode = process.env.PLAYWRIGHT_VISUAL === '1';
const configuredSlowMo = Number.parseInt(process.env.PLAYWRIGHT_SLOWMO ?? '', 10);
const slowMo = Number.isFinite(configuredSlowMo) ? configuredSlowMo : isVisualMode ? 250 : 0;

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: 'html',
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:80',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    headless: !isVisualMode,
    launchOptions: slowMo > 0 ? { slowMo } : undefined,
  },
});
