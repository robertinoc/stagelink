import { defineConfig, devices } from '@playwright/test';
import type { Project } from '@playwright/test';

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:4000';
const hasE2EAuthCredentials = Boolean(process.env.E2E_AUTH_EMAIL && process.env.E2E_AUTH_PASSWORD);

const authenticatedProjects: Project[] = hasE2EAuthCredentials
  ? [
      {
        name: 'setup',
        testMatch: /e2e\/auth\/.*\.setup\.ts/,
      },
      {
        name: 'authenticated',
        testMatch: ['**/artist/**/*.spec.ts', '**/critical/**/*.spec.ts'],
        use: {
          ...devices['Desktop Chrome'],
          storageState: 'e2e/.auth/artist.json',
        },
        dependencies: ['setup'],
      },
    ]
  : [];

export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.spec.ts',
  outputDir: process.env.PLAYWRIGHT_OUTPUT_DIR ?? 'test-results',
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
    // Auth UI smoke: no credentials needed, validates StageLink-owned pages.
    {
      name: 'auth-ui',
      use: { ...devices['Desktop Chrome'] },
      testMatch: '**/auth/**/*.spec.ts',
    },

    ...authenticatedProjects,

    // Public business journeys — safe without auth, driven by staging demo data.
    {
      name: 'public',
      use: { ...devices['Desktop Chrome'] },
      testMatch: ['**/public/**/*.spec.ts', '**/business/**/*.spec.ts'],
    },

    // Mobile — responsive regression on public journeys.
    {
      name: 'mobile',
      use: {
        ...devices['Pixel 5'],
      },
      testMatch: ['**/public/**/*.spec.ts', '**/business/**/*.spec.ts'],
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
