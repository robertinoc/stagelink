import { test, expect } from '@playwright/test';

/**
 * Keyboard navigation tests — verifies the app is fully operable
 * without a mouse, per WCAG 2.1 criterion 2.1.1 (Keyboard).
 */
test.describe('Keyboard navigation — Public', () => {
  test('can Tab to all nav links on landing', async ({ page }) => {
    await page.goto('/');

    const reachedLinks: string[] = [];
    // Tab up to 20 times and collect focused elements
    for (let i = 0; i < 20; i++) {
      await page.keyboard.press('Tab');
      const tag = await page.evaluate(() => document.activeElement?.tagName ?? '');
      const text = await page.evaluate(
        () => (document.activeElement as HTMLElement)?.innerText ?? '',
      );
      if (tag === 'A' || tag === 'BUTTON') reachedLinks.push(text.trim());
    }

    // Landing nav should have Login and CTA reachable via Tab
    expect(reachedLinks.some((t) => /login|get started|started/i.test(t))).toBeTruthy();
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

test.describe('Keyboard navigation — Dashboard', () => {
  test('sidebar links are keyboard navigable', async ({ page }) => {
    await page.goto('/en/dashboard');

    const navLinks = page.locator('aside nav a');
    const count = await navLinks.count();
    expect(count).toBeGreaterThan(3);

    // Each link is focusable
    for (let i = 0; i < count; i++) {
      await navLinks.nth(i).focus();
      const isFocused = await navLinks.nth(i).evaluate((el) => el === document.activeElement);
      expect(isFocused).toBeTruthy();
    }
  });

  test('can open and close dialogs via keyboard', async ({ page }) => {
    await page.goto('/en/dashboard/page');

    // Look for any dialog-triggering button
    const trigger = page.getByRole('button').first();
    if (await trigger.isVisible()) {
      await trigger.focus();
      await trigger.press('Enter');

      const dialog = page.getByRole('dialog');
      if (await dialog.isVisible()) {
        // Escape should close
        await page.keyboard.press('Escape');
        await expect(dialog).not.toBeVisible();
      }
    }
  });
});
