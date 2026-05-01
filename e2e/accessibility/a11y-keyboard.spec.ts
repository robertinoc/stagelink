import { test, expect } from '@playwright/test';

/**
 * Keyboard navigation tests — verifies the app is fully operable
 * without a mouse, per WCAG 2.1 criterion 2.1.1 (Keyboard).
 */
test.describe('Keyboard navigation — Public', () => {
  test('can Tab to all nav links on landing', async ({ page }) => {
    await page.goto('/');

    const reachedLinks: string[] = [];
    // Tab through the landing header/body and collect reachable controls.
    for (let i = 0; i < 40; i++) {
      await page.keyboard.press('Tab');
      const tag = await page.evaluate(() => document.activeElement?.tagName ?? '');
      const text = await page.evaluate(
        () => (document.activeElement as HTMLElement)?.innerText ?? '',
      );
      const href = await page.evaluate(
        () => (document.activeElement as HTMLAnchorElement)?.href ?? '',
      );
      if (tag === 'A' || tag === 'BUTTON') reachedLinks.push(`${text.trim()} ${href}`.trim());
    }

    // Landing nav should have Login and CTA reachable via Tab
    expect(
      reachedLinks.some((t) => /login|signup|sign up|get started|started/i.test(t)),
    ).toBeTruthy();
  });

  test('focus ring is visible on interactive elements', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('Tab');

    // The focused element should have a visible outline (axe checks this)
    const outlineStyle = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement;
      return window.getComputedStyle(el).outlineStyle;
    });

    expect(outlineStyle).not.toBe('none');
  });

  test('can navigate and activate mobile menu with keyboard', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');

    // Tab until we reach the Toggle menu button
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('Tab');
      const label = await page.evaluate(
        () => document.activeElement?.getAttribute('aria-label') ?? '',
      );
      if (label.toLowerCase().includes('toggle menu')) break;
    }

    // Activate with Enter
    await page.keyboard.press('Enter');
    await expect(page.getByRole('navigation', { name: /mobile navigation/i })).toBeVisible();
  });
});
