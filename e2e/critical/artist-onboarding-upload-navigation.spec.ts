import { test, expect } from '@playwright/test';
import path from 'path';
import { isMutationEnabled } from '../helpers/env';
import { expectAuthenticatedShellOrOnboarding } from '../helpers/workos';

const runOnboardingMutation = isMutationEnabled('E2E_RUN_ONBOARDING');
const runUploadMutation = isMutationEnabled('E2E_RUN_UPLOAD');

test.describe('Critical authenticated journeys', () => {
  test('authenticated user lands in the app or onboarding instead of auth screens', async ({
    page,
  }) => {
    await page.goto('/en/dashboard');

    await expectAuthenticatedShellOrOnboarding(page);
  });

  test('artist can navigate core dashboard surfaces', async ({ page }) => {
    await page.goto('/en/dashboard');
    await expectAuthenticatedShellOrOnboarding(page);

    test.skip(page.url().includes('/onboarding'), 'Seeded account has no artist profile yet');

    await page
      .getByRole('link', { name: /profile/i })
      .first()
      .click();
    await expect(page).toHaveURL(/\/en\/dashboard\/profile/);
    await expect(page.getByRole('heading', { name: /profile/i })).toBeVisible();

    await page
      .getByRole('link', { name: /page|my page/i })
      .first()
      .click();
    await expect(page).toHaveURL(/\/en\/dashboard\/page/);
    await expect(page.getByRole('heading', { name: /page|blocks|my page/i })).toBeVisible();

    await page
      .getByRole('link', { name: /analytics/i })
      .first()
      .click();
    await expect(page).toHaveURL(/\/en\/dashboard\/analytics/);
    await expect(
      page.getByRole('heading', { level: 1, name: 'Analytics' }),
    ).toBeVisible();
  });

  test('new artist can complete profile creation through onboarding', async ({ page }) => {
    test.skip(!runOnboardingMutation, 'Set E2E_RUN_ONBOARDING=true with a reset test user');

    const uniqueId = Date.now().toString(36);
    const artistName = `StageLink QA ${uniqueId}`;
    const username = `stagelink-qa-${uniqueId}`.slice(0, 30);

    await page.goto('/en/onboarding');
    await expect(page.getByRole('heading', { name: /what's your artist name/i })).toBeVisible();

    await page.getByLabel(/artist name/i).fill(artistName);
    await page.getByRole('button', { name: /continue/i }).click();

    await expect(page.getByRole('heading', { name: /choose your username/i })).toBeVisible();
    await page.getByLabel(/username/i).fill(username);
    await expect(
      page.getByText(new RegExp(`${username} is available|could not verify`, 'i')),
    ).toBeVisible();
    await page.getByRole('button', { name: /continue/i }).click();

    await expect(page.getByRole('heading', { name: /what kind of artist/i })).toBeVisible();
    await page.getByRole('button', { name: /musician/i }).click();
    await page.getByRole('button', { name: /continue/i }).click();

    await expect(page.getByRole('heading', { name: /add a profile photo/i })).toBeVisible();
    await page.getByRole('button', { name: /skip for now/i }).click();

    await expect(page).toHaveURL(/\/en\/dashboard/);
    await expect(page.getByRole('navigation')).toBeVisible();
  });

  test('artist can start an avatar upload from profile settings', async ({ page }) => {
    test.skip(!runUploadMutation, 'Set E2E_RUN_UPLOAD=true only when S3 upload env is available');

    await page.goto('/en/dashboard/profile');
    test.skip(page.url().includes('/onboarding'), 'Seeded account has no artist profile yet');

    const fixture = path.join(process.cwd(), 'apps/web/src/app/icon.png');
    await page.locator('input[type="file"][accept*="image"]').first().setInputFiles(fixture);

    await expect(page.getByText(/uploaded successfully|upload failed/i)).toBeVisible({
      timeout: 30_000,
    });
  });
});
