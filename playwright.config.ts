import { defineConfig, devices } from '@playwright/test';

// Gerçek tarayıcı testleri: önce `pnpm build`, sonra `pnpm test:e2e`. Sunucu scripts/e2e-server.mjs ile geçici veritabanında açılır.
const port = process.env.E2E_PORT || '3292';

export default defineConfig({
  testDir: 'e2e',
  outputDir: '.test-tmp/e2e/results',
  workers: 1,
  forbidOnly: !!process.env.CI,
  reporter: 'list',
  timeout: 60_000,
  use: { baseURL: 'http://127.0.0.1:' + port, locale: 'tr-TR', timezoneId: 'Europe/Istanbul', trace: 'retain-on-failure' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: { command: 'node scripts/e2e-server.mjs', url: 'http://127.0.0.1:' + port + '/api/health', reuseExistingServer: false, timeout: 120_000, env: { E2E_PORT: port } },
});
