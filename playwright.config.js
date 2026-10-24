import { defineConfig } from '@playwright/test';

// BASE_URL bisa diarahkan ke server lain (mis. prototipe lama) untuk membandingkan perilaku.
const base = process.env.BASE_URL || 'http://localhost:4173';

export default defineConfig({
  testDir: 'tests',
  fullyParallel: true,
  reporter: 'list',
  use: {
    baseURL: base,
    locale: 'id-ID',
    timezoneId: 'Asia/Jakarta',
    viewport: { width: 390, height: 800 },
    serviceWorkers: 'block'
  },
  projects: [{ name: 'chromium', use: { browserName: 'chromium' } }],
  // Tes berjalan melawan hasil build produksi (sama dengan yang dipakai Vercel).
  webServer: process.env.BASE_URL ? undefined : {
    command: 'npm run build && npm run start',
    url: base,
    reuseExistingServer: true,
    timeout: 180_000
  }
});
