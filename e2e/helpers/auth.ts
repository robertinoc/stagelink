import { Page } from '@playwright/test';

export async function waitForSession(page: Page): Promise<void> {
  await page.waitForURL((url) => !url.pathname.startsWith('/api/auth'), {
    timeout: 15_000,
  });
}
