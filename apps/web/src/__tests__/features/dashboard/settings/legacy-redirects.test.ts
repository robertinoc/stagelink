import { describe, expect, it, vi, beforeEach } from 'vitest';

/**
 * Locks in the 301-style redirects from the 5 legacy settings sub-routes
 * to the new tabbed page. These can't be checked end-to-end with curl
 * because the `(app)` auth middleware rewrites unauthenticated requests to
 * /login before the page component runs — so we assert the page's own
 * redirect() call directly, with next/navigation mocked.
 */

const redirectMock = vi.fn();
vi.mock('next/navigation', () => ({
  redirect: (url: string) => redirectMock(url),
}));

interface LegacyPageModule {
  default: (args: { params: Promise<{ locale: string }> }) => Promise<unknown>;
}

const CASES: Array<{ route: string; importer: () => Promise<LegacyPageModule>; tab: string }> = [
  {
    route: 'plans-billing',
    tab: 'plan',
    importer: () =>
      import('@/app/[locale]/(app)/dashboard/settings/plans-billing/page') as Promise<LegacyPageModule>,
  },
  {
    route: 'insights-connections',
    tab: 'connections',
    importer: () =>
      import('@/app/[locale]/(app)/dashboard/settings/insights-connections/page') as Promise<LegacyPageModule>,
  },
  {
    route: 'shopify-store',
    tab: 'stores',
    importer: () =>
      import('@/app/[locale]/(app)/dashboard/settings/shopify-store/page') as Promise<LegacyPageModule>,
  },
  {
    route: 'smart-merch',
    tab: 'stores',
    importer: () =>
      import('@/app/[locale]/(app)/dashboard/settings/smart-merch/page') as Promise<LegacyPageModule>,
  },
  {
    route: 'privacy',
    tab: 'privacy',
    importer: () =>
      import('@/app/[locale]/(app)/dashboard/settings/privacy/page') as Promise<LegacyPageModule>,
  },
];

describe('legacy settings route redirects', () => {
  beforeEach(() => {
    redirectMock.mockClear();
  });

  for (const { route, tab, importer } of CASES) {
    it(`/${route} redirects to ?tab=${tab} (en)`, async () => {
      const mod = await importer();
      await mod.default({ params: Promise.resolve({ locale: 'en' }) });
      expect(redirectMock).toHaveBeenCalledWith(`/en/dashboard/settings?tab=${tab}`);
    });
  }

  it('preserves the active locale in the redirect target', async () => {
    const plansBilling = CASES.find((c) => c.route === 'plans-billing');
    if (!plansBilling) throw new Error('plans-billing case missing');
    const mod = await plansBilling.importer();
    await mod.default({ params: Promise.resolve({ locale: 'es' }) });
    expect(redirectMock).toHaveBeenCalledWith('/es/dashboard/settings?tab=plan');
  });
});
