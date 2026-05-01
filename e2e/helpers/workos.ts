import { expect, type Page } from '@playwright/test';

export async function expectAuthenticatedShellOrOnboarding(page: Page): Promise<void> {
  await expect(page).not.toHaveURL(/\/login|\/signup|\/api\/auth/);

  const appShell = page.getByRole('navigation');
  const onboardingHeading = page.getByRole('heading', {
    name: /what's your artist name|choose your username|what kind of artist/i,
  });

  await expect(appShell.or(onboardingHeading)).toBeVisible();
}
