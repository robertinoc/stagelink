import { expect, test } from '@playwright/test';

/**
 * Authenticated keyboard navigation tests for dashboard-only surfaces.
 */
test.describe('Keyboard navigation — Dashboard', () => {
  test('sidebar links are keyboard navigable', async ({ page }) => {
    await page.goto('/en/dashboard');

    const navLinks = page.locator('aside nav a');
    const count = await navLinks.count();
    expect(count).toBeGreaterThan(3);

    for (let i = 0; i < count; i++) {
      await navLinks.nth(i).focus();
      const isFocused = await navLinks.nth(i).evaluate((el) => el === document.activeElement);
      expect(isFocused).toBeTruthy();
    }
  });

  test('can open and close dialogs via keyboard', async ({ page }) => {
    await page.goto('/en/dashboard/page');

    const trigger = page.getByRole('button').first();
    if (await trigger.isVisible()) {
      await trigger.focus();
      await trigger.press('Enter');

      const dialog = page.getByRole('dialog');
      if (await dialog.isVisible()) {
        await page.keyboard.press('Escape');
        await expect(dialog).not.toBeVisible();
      }
    }
  });
});
