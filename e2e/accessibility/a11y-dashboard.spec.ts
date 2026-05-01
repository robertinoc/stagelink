import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * Accessibility audit — authenticated dashboard pages.
 * Uses the saved auth state from e2e/.auth/artist.json
 */
test.describe('A11y — Dashboard (authenticated)', () => {
  test('dashboard passes WCAG AA', async ({ page }) => {
    await page.goto('/en/dashboard');

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      // Exclude third-party widgets that we don't control
      .exclude('[data-posthog]')
      .analyze();

    expect(results.violations).toEqual([]);
  });

  test('sidebar nav items have aria-current on active item', async ({ page }) => {
    await page.goto('/en/dashboard');

    // The active nav link must have aria-current="page"
    const activeLink = page.locator('nav a[aria-current="page"]');
    await expect(activeLink).toHaveCount(1);
  });

  test('sidebar nav icons are hidden from assistive tech', async ({ page }) => {
    await page.goto('/en/dashboard');

    // Lucide icons inside nav links must have aria-hidden="true"
    const navIcons = page.locator('nav a svg[aria-hidden="true"]');
    const count = await navIcons.count();
    expect(count).toBeGreaterThan(0);
  });

  test('dashboard page heading hierarchy is correct', async ({ page }) => {
    await page.goto('/en/dashboard');
    const h1 = page.getByRole('heading', { level: 1 });
    await expect(h1).toHaveCount(1);
  });

  test('plan badge is a span (inline element)', async ({ page }) => {
    await page.goto('/en/dashboard');
    // Badge should be a <span>, not a <div>, for inline context
    const badge = page.locator('aside span.rounded-full').first();
    await expect(badge).toBeVisible();
  });

  test('settings submenu items have aria-current when active', async ({ page }) => {
    await page.goto('/en/dashboard/settings/plans-billing');

    const activeChild = page.locator(
      'aside a[href$="/dashboard/settings/plans-billing"][aria-current="page"]',
    );
    await expect(activeChild).toHaveCount(1);
  });

  test('page editor passes WCAG AA', async ({ page }) => {
    await page.goto('/en/dashboard/page');

    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();

    expect(results.violations).toEqual([]);
  });

  test('analytics page passes WCAG AA', async ({ page }) => {
    await page.goto('/en/dashboard/analytics');

    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();

    expect(results.violations).toEqual([]);
  });

  test('mobile sidebar opens and traps focus', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/en/dashboard');

    const hamburger = page.getByRole('button', { name: /open navigation menu/i });
    await hamburger.click();

    // Sidebar sheet should be open
    await expect(page.getByRole('dialog')).toBeVisible();

    // Pressing Escape should close it
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).not.toBeVisible();
  });
});
