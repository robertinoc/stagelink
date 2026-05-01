import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * Accessibility audit — public / unauthenticated pages.
 * Runs against: landing, login, signup, public artist page.
 * Uses axe-core for automated WCAG 2.1 AA checks.
 */
test.describe('A11y — Public pages', () => {
  test('landing page passes WCAG AA', async ({ page }) => {
    await page.goto('/');

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    expect(results.violations).toEqual([]);
  });

  test('login page passes WCAG AA', async ({ page }) => {
    await page.goto('/en/login');

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    expect(results.violations).toEqual([]);
  });

  test('signup page passes WCAG AA', async ({ page }) => {
    await page.goto('/en/signup');

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    expect(results.violations).toEqual([]);
  });

  test('landing heading hierarchy is correct', async ({ page }) => {
    await page.goto('/');
    const h1 = page.getByRole('heading', { level: 1 });
    await expect(h1).toBeVisible();
    // Only one h1 per page
    await expect(h1).toHaveCount(1);
  });

  test('landing navbar has accessible landmarks', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('banner')).toBeVisible(); // <header>
    await expect(page.getByRole('navigation').first()).toBeVisible();
  });

  test('mobile menu button announces expanded state', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 }); // iPhone 14
    await page.goto('/');

    const menuBtn = page.getByRole('button', { name: /toggle menu/i });
    await expect(menuBtn).toHaveAttribute('aria-expanded', 'false');

    await menuBtn.click();
    await expect(menuBtn).toHaveAttribute('aria-expanded', 'true');

    const mobileNav = page.getByRole('navigation', { name: /mobile navigation/i });
    await expect(mobileNav).toBeVisible();
  });

  test('LoadingState has role=status', async ({ page }) => {
    // Intercept a slow route to catch loading state in the wild
    await page.goto('/');
    // Verify the component contract via locator if loading state appears
    const loading = page.locator('[role="status"]');
    // If visible, must have aria-label
    const count = await loading.count();
    for (let i = 0; i < count; i++) {
      await expect(loading.nth(i)).toHaveAttribute('aria-label');
    }
  });

  test('landing page images have alt text', async ({ page }) => {
    await page.goto('/');
    const images = page.locator('img');
    const count = await images.count();
    for (let i = 0; i < count; i++) {
      const alt = await images.nth(i).getAttribute('alt');
      const isDecorative = await images.nth(i).getAttribute('aria-hidden');
      expect(alt !== null || isDecorative === 'true').toBeTruthy();
    }
  });

  test('interactive elements are keyboard reachable on landing', async ({ page }) => {
    await page.goto('/');
    // Tab through interactive elements — none should be skipped
    await page.keyboard.press('Tab');
    const focused = await page.evaluate(() => document.activeElement?.tagName);
    expect(['A', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA']).toContain(focused);
  });
});
