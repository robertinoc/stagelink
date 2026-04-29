import { test as setup, expect } from '@playwright/test';
import * as fs from 'fs';
import path from 'path';

const ARTIST_AUTH_FILE = path.join(__dirname, '../.auth/artist.json');

// Completa el flujo OAuth de WorkOS y persiste la sesión.
// Implementar cuando las credenciales de test de staging estén disponibles.
setup('authenticate as artist', async ({ page }) => {
  fs.mkdirSync(path.dirname(ARTIST_AUTH_FILE), { recursive: true });
  await page.goto('/api/auth/signin');
  await page.waitForURL((url) => !url.pathname.startsWith('/api/auth'), {
    timeout: 15_000,
  });
  await expect(page).not.toHaveURL(/\/api\/auth/);
  await page.context().storageState({ path: ARTIST_AUTH_FILE });
});
