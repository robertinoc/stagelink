import { test, expect } from '@playwright/test';
import { requireEnv } from '../helpers/env';

test.describe('Business journeys — public artist page', () => {
  test('fan discovers an artist profile by direct StageLink URL', async ({ page }) => {
    const username = requireEnv('E2E_DEMO_ARTIST');

    const response = await page.goto(`/p/${username}`);
    test.skip(response?.status() === 404, `Demo artist "${username}" is not published`);

    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByText(new RegExp(`@${username}`, 'i'))).toBeVisible();
  });

  test('booking visitor can find the artist contact action', async ({ page }) => {
    const username = requireEnv('E2E_DEMO_ARTIST');

    const response = await page.goto(`/p/${username}`);
    test.skip(response?.status() === 404, `Demo artist "${username}" is not published`);

    const bookingLink = page.locator('a[href^="mailto:"]').first();
    test.skip(!(await bookingLink.isVisible()), 'Demo artist does not expose booking email');

    await expect(bookingLink).toHaveAttribute('href', /^mailto:.+@.+\..+/);
  });

  test('fan can subscribe for notifications when the page exposes a fan-list block', async ({
    page,
  }) => {
    const username = requireEnv('E2E_DEMO_ARTIST');

    const response = await page.goto(`/p/${username}`);
    test.skip(response?.status() === 404, `Demo artist "${username}" is not published`);

    const emailInput = page.getByRole('textbox', { name: /email/i }).first();
    test.skip(
      !(await emailInput.isVisible()),
      'Demo artist does not expose an email capture block',
    );

    await emailInput.fill(`fan-${Date.now()}@example.com`);

    const consent = page.getByRole('checkbox').first();
    if (await consent.isVisible().catch(() => false)) {
      await consent.check();
    }

    await page
      .getByRole('button', { name: /subscribe|join|notify/i })
      .first()
      .click();
    await expect(page.getByText(/you're in|success|subscribed|thank/i)).toBeVisible({
      timeout: 10_000,
    });
  });
});
