import { test, expect } from '@playwright/test';

// Smoke tests — sin auth, safe en producción

test.describe('Smoke — Homepage', () => {
  test('root URL responde con 200', async ({ page }) => {
    const response = await page.goto('/');
    expect(response?.status()).toBe(200);
  });

  test('landing page renderiza heading principal', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('no hay errores de consola en landing', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    await page.goto('/');
    expect(errors).toHaveLength(0);
  });
});
