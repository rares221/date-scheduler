import { defineConfig } from '@playwright/test';

const BASE_URL = process.env['BASE_URL'];

const UA =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/131.0.6778.73 Mobile/15E148 Safari/604.1';

export default defineConfig({
  testDir: './e2e',
  timeout: 120_000,
  retries: 1,
  workers: 1,
  reporter: [['list']],
  outputDir: 'test-results',
  use: {
    baseURL: BASE_URL ?? 'http://localhost:4200',
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    userAgent: UA,
    launchOptions: { args: ['--autoplay-policy=no-user-gesture-required'] },
  },
  projects: [{ name: 'iphone-chrome', use: { browserName: 'chromium' } }],
  webServer: BASE_URL
    ? undefined
    : {
        command: 'npx ng serve --host 127.0.0.1 --port 4200',
        url: 'http://localhost:4200',
        reuseExistingServer: true,
        timeout: 180_000,
      },
});

