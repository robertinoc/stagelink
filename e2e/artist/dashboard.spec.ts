import { test, expect } from '@playwright/test';

test.describe('Artist — Dashboard', () => {
  test('dashboard carga para usuario autenticado', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).not.toHaveURL(/\/login|\/signin/);
  });

  test('sidebar de navegación es visible', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.getByRole('navigation')).toBeVisible();
  });
});
