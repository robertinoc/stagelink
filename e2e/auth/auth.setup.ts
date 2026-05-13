import { test as setup, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import * as fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ARTIST_AUTH_FILE = path.join(__dirname, '../.auth/artist.json');
const E2E_AUTH_EMAIL = process.env.E2E_AUTH_EMAIL;
const E2E_AUTH_PASSWORD = process.env.E2E_AUTH_PASSWORD;
const AUTH_SETUP_TIMEOUT = 120_000;
const AUTH_FAILED_ERROR = [
  'WorkOS callback returned /login?error=auth_failed.',
  'Most likely causes:',
  '- PLAYWRIGHT_BASE_URL / STAGING_URL host does not match the WorkOS callback host, so the PKCE state cookie is written on one domain and read on another.',
  '- WORKOS_REDIRECT_URI in the staging deployment is not the same origin as STAGING_URL.',
  '- WORKOS_COOKIE_DOMAIN is scoped to a different parent domain than STAGING_URL.',
  '- The staging WorkOS environment rejected the login or requires an interactive challenge.',
].join('\n');

function isAuthenticatedAppUrl(url: URL): boolean {
  const pathname = url.pathname;
  return pathname.includes('/dashboard') || pathname.includes('/onboarding');
}

async function completeHostedAuth(page: Page) {
  if (!E2E_AUTH_EMAIL || !E2E_AUTH_PASSWORD) {
    throw new Error('E2E_AUTH_EMAIL and E2E_AUTH_PASSWORD are required for authenticated E2E');
  }

  // Start from the route handler that creates the WorkOS PKCE state cookie and
  // redirect URL in a single response. Visiting /en/login first can create a
  // stale verifier cookie during CI and make the callback fail with a state
  // mismatch after the hosted login succeeds.
  await page.goto('/api/auth/signin?returnTo=/en/dashboard');

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

  const invalidCredentials = page.getByText(/invalid email or password/i).first();
  const invalidCredentialsResult = invalidCredentials
    .waitFor({ state: 'visible', timeout: 10_000 })
    .then(() => 'invalid-credentials' as const)
    .catch(() => new Promise<never>(() => undefined));

  const callbackFailureResult = page
    .waitForURL(
      (url) => url.pathname.endsWith('/login') && url.searchParams.get('error') === 'auth_failed',
      {
        timeout: 90_000,
        waitUntil: 'domcontentloaded',
      },
    )
    .then(() => 'auth-failed' as const)
    .catch(() => new Promise<never>(() => undefined));

  const authResult = await Promise.race([
    page
      .waitForURL((url) => isAuthenticatedAppUrl(url), {
        timeout: 90_000,
        waitUntil: 'domcontentloaded',
      })
      .then(() => 'authenticated' as const),
    invalidCredentialsResult,
    callbackFailureResult,
  ]);

  if (authResult === 'invalid-credentials') {
    await passwordInput.fill('');
    throw new Error(
      'WorkOS rejected E2E_AUTH_EMAIL/E2E_AUTH_PASSWORD. Update the staging GitHub environment secrets with a valid staging test user before running authenticated E2E.',
    );
  }

  if (authResult === 'auth-failed') {
    throw new Error(AUTH_FAILED_ERROR);
  }

  if (authResult !== 'authenticated') {
    throw new Error('Hosted auth did not complete before timeout.');
  }
}

setup('authenticate as artist', async ({ page }) => {
  setup.setTimeout(AUTH_SETUP_TIMEOUT);
  fs.mkdirSync(path.dirname(ARTIST_AUTH_FILE), { recursive: true });

  await completeHostedAuth(page);

  await expect(page).not.toHaveURL(/\/login|\/signup|\/api\/auth/);
  await page.context().storageState({ path: ARTIST_AUTH_FILE });
});
