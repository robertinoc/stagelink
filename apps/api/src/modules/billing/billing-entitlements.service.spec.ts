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

  it('keeps paid access while a paid subscription is still active but set to cancel at period end', async () => {
    const { service, prisma } = createService();
    prisma.subscription.findUnique.mockResolvedValue({
      plan: 'pro',
      status: SubscriptionStatus.active,
      cancelAtPeriodEnd: true,
    });

    await expect(service.getArtistEntitlements('artist_canceling')).resolves.toMatchObject({
      effectivePlan: 'pro',
      billingPlan: 'pro',
      subscriptionStatus: 'active',
      cancelAtPeriodEnd: true,
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

  it('keeps paid access during past_due while the paid period is still clearly active', async () => {
    const { service, prisma } = createService();
    prisma.subscription.findUnique.mockResolvedValue({
      plan: 'pro_plus',
      status: SubscriptionStatus.past_due,
      cancelAtPeriodEnd: false,
      currentPeriodEnd: new Date('2099-05-01T00:00:00.000Z'),
    });

    await expect(service.getArtistEntitlements('artist_past_due_grace')).resolves.toMatchObject({
      effectivePlan: 'pro_plus',
      billingPlan: 'pro_plus',
      subscriptionStatus: 'past_due',
      features: {
        analytics_pro: true,
        shopify_integration: true,
      },
    });
  });

  it('keeps unpaid subscriptions conservative without premium access', async () => {
    const { service, prisma } = createService();
    prisma.subscription.findUnique.mockResolvedValue({
      plan: 'pro',
      status: SubscriptionStatus.unpaid,
      cancelAtPeriodEnd: false,
      currentPeriodEnd: new Date('2099-05-01T00:00:00.000Z'),
    });

    await expect(service.getArtistEntitlements('artist_unpaid')).resolves.toMatchObject({
      effectivePlan: 'free',
      billingPlan: 'pro',
      subscriptionStatus: 'unpaid',
      features: {
        custom_domain: false,
        epk_builder: false,
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
