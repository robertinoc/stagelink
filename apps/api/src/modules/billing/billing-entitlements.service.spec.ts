import { SubscriptionStatus } from '@prisma/client';
import { FeatureAccessException } from './feature-access.exception';
import { BillingEntitlementsService } from './billing-entitlements.service';

describe('BillingEntitlementsService', () => {
  function createService() {
    const prisma = {
      subscription: {
        findUnique: jest.fn(),
      },
    };

    const service = new BillingEntitlementsService(prisma as never);
    return { service, prisma };
  }

  it('falls back to free entitlements when no subscription exists', async () => {
    const { service, prisma } = createService();
    prisma.subscription.findUnique.mockResolvedValue(null);

    await expect(service.getArtistEntitlements('artist_free')).resolves.toMatchObject({
      effectivePlan: 'free',
      billingPlan: 'free',
      subscriptionStatus: 'inactive',
      features: {
        analytics_pro: false,
        custom_domain: false,
      },
    });
  });

  it('keeps the paid effective plan only for active subscriptions', async () => {
    const { service, prisma } = createService();
    prisma.subscription.findUnique.mockResolvedValue({
      plan: 'pro',
      status: SubscriptionStatus.active,
      cancelAtPeriodEnd: false,
    });

    await expect(service.getArtistEntitlements('artist_pro')).resolves.toMatchObject({
      effectivePlan: 'pro',
      billingPlan: 'pro',
      subscriptionStatus: 'active',
      features: {
        custom_domain: true,
        analytics_pro: false,
      },
    });
  });

  it('downgrades effective access to free for non-active paid statuses', async () => {
    const { service, prisma } = createService();
    prisma.subscription.findUnique.mockResolvedValue({
      plan: 'pro_plus',
      status: SubscriptionStatus.past_due,
      cancelAtPeriodEnd: false,
    });

    await expect(service.getArtistEntitlements('artist_past_due')).resolves.toMatchObject({
      effectivePlan: 'free',
      billingPlan: 'pro_plus',
      subscriptionStatus: 'past_due',
      features: {
        analytics_pro: false,
        shopify_integration: false,
      },
    });
  });

  it('throws a semantic feature lock error when access is not included', async () => {
    const { service, prisma } = createService();
    prisma.subscription.findUnique.mockResolvedValue(null);

    await expect(service.assertFeatureAccess('artist_free', 'analytics_pro')).rejects.toMatchObject(
      {
        response: expect.objectContaining({
          code: 'FEATURE_NOT_INCLUDED_IN_PLAN',
          feature: 'analytics_pro',
          effectivePlan: 'free',
          billingPlan: 'free',
          subscriptionStatus: 'inactive',
          requiredPlan: 'pro_plus',
        }),
      },
    );
    await expect(
      service.assertFeatureAccess('artist_free', 'analytics_pro'),
    ).rejects.toBeInstanceOf(FeatureAccessException);
  });
});
