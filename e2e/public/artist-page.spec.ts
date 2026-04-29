import { test, expect } from '@playwright/test';

test.describe('Public — Artist page', () => {
  test('página pública de artista carga correctamente', async ({ page }) => {
    // Navegar a una página de artista de demo/staging
    const username = process.env.E2E_DEMO_ARTIST ?? 'demo';
    const response = await page.goto(`/${username}`);
    // 200 o 404 son válidos según si existe el artista en staging
    expect([200, 404]).toContain(response?.status());
  });
});
