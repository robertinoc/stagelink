import { test, expect } from '@playwright/test';
import { requireEnv } from '../helpers/env';

test.describe('UAT — real user journeys', () => {
  test('new artist can understand the offer and reach signup/login', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    const pricingLink = page.locator('a[href$="/pricing"]').first();
    await expect(pricingLink).toBeVisible();
    await pricingLink.click();
    await expect(page).toHaveURL(/\/pricing/);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    await page.goto('/en/signup');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByRole('link', { name: /log in|sign in/i })).toBeVisible();

    await page.goto('/en/login');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByRole('link', { name: /sign up|get started/i })).toBeVisible();
  });

  test('fan can inspect a demo artist page without friction', async ({ page }) => {
    const username = requireEnv('E2E_DEMO_ARTIST');

    const response = await page.goto(`/p/${username}`);
    test.skip(response?.status() === 404, `Demo artist "${username}" is not published`);

    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByText(new RegExp(`@${username}`, 'i'))).toBeVisible();

    const links = page.locator('main a[href]');
    test.skip(
      (await links.count()) === 0,
      `Demo artist "${username}" has no published public links`,
    );
    await expect(links.first()).toBeVisible();
  });
});
