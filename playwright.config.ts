import { defineConfig, devices } from '@playwright/test';

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:4000';

export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.spec.ts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? 'github' : 'html',
  timeout: 30_000,
  expect: { timeout: 5_000 },

  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    // Setup: crea sesiones de auth reutilizables
    {
      name: 'setup',
      testMatch: /e2e\/auth\/.*\.setup\.ts/,
    },

    // Tests autenticados — Chromium (user público / artista)
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'e2e/.auth/artist.json',
      },
      dependencies: ['setup'],
      testIgnore: ['**/smoke/**', '**/auth/**'],
    },

    // Mobile — regresión responsiva en journeys clave
    {
      name: 'mobile',
      use: {
        ...devices['Pixel 5'],
        storageState: 'e2e/.auth/artist.json',
      },
      dependencies: ['setup'],
      testMatch: '**/public/**/*.spec.ts',
    },

    // Smoke tests — sin auth, safe en producción
    {
      name: 'smoke',
      use: { ...devices['Desktop Chrome'] },
      testMatch: '**/smoke/**/*.spec.ts',
    },
  ],

  // Levanta el servidor Next.js si no hay uno corriendo en dev
  webServer: process.env.CI
    ? undefined
    : {
        command: 'pnpm --filter @stagelink/web dev',
        url: BASE_URL,
        reuseExistingServer: true,
        timeout: 60_000,
      },
});
