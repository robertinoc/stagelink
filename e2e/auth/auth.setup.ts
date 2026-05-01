import { test as setup, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import * as fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ARTIST_AUTH_FILE = path.join(__dirname, '../.auth/artist.json');
const E2E_AUTH_EMAIL = process.env.E2E_AUTH_EMAIL;
const E2E_AUTH_PASSWORD = process.env.E2E_AUTH_PASSWORD;

async function completeHostedAuth(page: Page) {
  if (!E2E_AUTH_EMAIL || !E2E_AUTH_PASSWORD) {
    throw new Error('E2E_AUTH_EMAIL and E2E_AUTH_PASSWORD are required for authenticated E2E');
  }

  await page.goto('/en/login');
  await page.getByRole('button', { name: /sign in/i }).click();

  await expect(page).toHaveURL(/workos|authkit|api\/auth/i, { timeout: 15_000 });

  const emailInput = page.getByLabel(/email/i).or(page.locator('input[type="email"]')).first();
  await emailInput.waitFor({ state: 'visible', timeout: 15_000 });
  await emailInput.fill(E2E_AUTH_EMAIL);

  const firstContinue = page.getByRole('button', {
    name: /continue|next|sign in|log in/i,
  });
  if (
    await firstContinue
      .first()
      .isVisible()
      .catch(() => false)
  ) {
    await firstContinue.first().click();
  }

  const passwordInput = page
    .getByLabel(/password/i)
    .or(page.locator('input[type="password"]'))
    .first();
  await passwordInput.waitFor({ state: 'visible', timeout: 15_000 });
  await passwordInput.fill(E2E_AUTH_PASSWORD);

  await page
    .getByRole('button', { name: /sign in|log in|continue/i })
    .first()
    .click();
}

setup('authenticate as artist', async ({ page }) => {
  fs.mkdirSync(path.dirname(ARTIST_AUTH_FILE), { recursive: true });

  await completeHostedAuth(page);

  await page.waitForURL(
    (url) => {
      const pathname = url.pathname;
      return pathname.includes('/dashboard') || pathname.includes('/onboarding');
    },
    {
      timeout: 30_000,
    },
  );

  await expect(page).not.toHaveURL(/\/login|\/signup|\/api\/auth/);
  await page.context().storageState({ path: ARTIST_AUTH_FILE });
});
