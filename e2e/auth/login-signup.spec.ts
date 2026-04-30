import { test, expect } from '@playwright/test';

test.describe('Auth UI — signup and login entry points', () => {
  test('login page renders the WorkOS entry point and links to signup', async ({ page }) => {
    await page.goto('/en/login');

    await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();

    await page.getByRole('link', { name: /sign up/i }).click();
    await expect(page).toHaveURL(/\/en\/signup$/);
    await expect(page.getByRole('heading', { name: /create your stage/i })).toBeVisible();
  });

  test('signup page renders the account creation entry point and links to login', async ({
    page,
  }) => {
    await page.goto('/en/signup');

    await expect(page.getByRole('heading', { name: /create your stage/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /create account/i })).toBeVisible();

    await page.getByRole('link', { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/en\/login$/);
    await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible();
  });
});
