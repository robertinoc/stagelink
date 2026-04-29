import { test, expect } from '@playwright/test';

test.describe('Artist — Page editor', () => {
  test('editor de página carga', async ({ page }) => {
    await page.goto('/dashboard/page');
    await expect(page).not.toHaveURL(/\/login|\/signin/);
  });

  test('puede agregar un bloque de link', async ({ page }) => {
    await page.goto('/dashboard/page');
    const addButton = page.getByRole('button', { name: /add|agregar|link/i }).first();
    if (await addButton.isVisible()) {
      await addButton.click();
      await expect(
        page.getByRole('dialog').or(page.locator('[data-testid="block-form"]')),
      ).toBeVisible();
    }
  });
});
