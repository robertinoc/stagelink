import { BadRequestException } from '@nestjs/common';
import { PlanTier, Prisma, SubscriptionStatus } from '@prisma/client';
import { BillingService } from './billing.service';

describe('BillingService', () => {
  interface PrismaMock {
    $transaction: jest.Mock<Promise<unknown>, [(tx: PrismaMock) => Promise<unknown>]>;
    subscription: {
      findUnique: jest.Mock;
      update: jest.Mock;
      create: jest.Mock;
      upsert: jest.Mock;
    };
    stripeWebhookEvent: {
      create: jest.Mock;
    };
  }

  function createService() {
    const prisma = {} as PrismaMock;

    prisma.$transaction = jest.fn(async (callback: (tx: PrismaMock) => Promise<unknown>) =>
      callback(prisma),
    );
    prisma.subscription = {
      findUnique: jest.fn().mockResolvedValue(null),
      update: jest.fn(),
      create: jest.fn(),
      upsert: jest.fn(),
    };
    prisma.stripeWebhookEvent = {
      create: jest.fn(),
    };

    const configService = {
      get: jest.fn((key: string) => {
        switch (key) {
          case 'stripe.webhookSecret':
            return 'whsec_test';
          case 'stripe.proPriceId':
            return 'price_pro_123';
          case 'stripe.proPlusPriceId':
            return 'price_pro_plus_456';
          case 'app.frontendUrl':
            return 'http://localhost:4000';
          case 'app.corsAllowedOrigins':
            return '';
          default:
            return undefined;
        }
      }),
    };

    const stripe = {
      prices: {
        retrieve: jest.fn(async (priceId: string) => ({
          id: priceId,
          active: true,
          unit_amount: priceId === 'price_pro_plus_456' ? 1900 : 900,
          currency: 'usd',
          recurring: { interval: 'month' },
          product: {
            name: priceId === 'price_pro_plus_456' ? 'Pro+' : 'Pro',
            description: null,
          },
        })),
      },
      webhooks: {
        constructEvent: jest.fn(),
      },
      subscriptions: {
        retrieve: jest.fn(),
        list: jest.fn(),
      },
    };

    const service = new BillingService(prisma as never, configService as never, stripe as never);
    return { service, prisma, stripe };
  }

  it('rejects checkout attempts for the free plan', async () => {
    const { service } = createService();

    await expect(
      service.createCheckoutSession(
        'artist_123',
        { plan: 'free', returnUrl: 'http://localhost:4000/en/dashboard/billing' },
        { email: 'owner@example.com' } as never,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('syncs subscription data from Stripe webhook events', async () => {
    const { service, prisma, stripe } = createService();

    (stripe.webhooks.constructEvent as jest.Mock).mockReturnValue({
      id: 'evt_123',
      created: 1775683200,
      type: 'customer.subscription.updated',
      data: {
        object: {
          object: 'subscription',
          id: 'sub_123',
          status: 'active',
          cancel_at_period_end: true,
          customer: 'cus_123',
          metadata: { artistId: 'artist_123', plan: PlanTier.pro_plus },
          items: {
            data: [
              {
                current_period_end: 1711929600,
                price: {
                  id: 'price_pro_plus_456',
                },
              },
            ],
          },
        },
      },
    });

    await service.handleWebhook({
      headers: { 'stripe-signature': 'sig_123' },
      rawBody: Buffer.from('{}'),
    } as never);

    expect(prisma.stripeWebhookEvent.create).toHaveBeenCalledWith({
      data: {
        stripeEventId: 'evt_123',
        stripeEventType: 'customer.subscription.updated',
        artistId: 'artist_123',
        stripeEventAt: new Date('2026-04-08T21:20:00.000Z'),
      },
    });

    expect(prisma.subscription.upsert).toHaveBeenCalledWith({
      where: { artistId: 'artist_123' },
      update: {
        plan: PlanTier.pro_plus,
        status: SubscriptionStatus.active,
        stripeCustomerId: 'cus_123',
        stripeSubscriptionId: 'sub_123',
        stripePriceId: 'price_pro_plus_456',
        cancelAtPeriodEnd: true,
        currentPeriodEnd: new Date('2024-04-01T00:00:00.000Z'),
        lastStripeEventAt: new Date('2026-04-08T21:20:00.000Z'),
      },
      create: {
        artistId: 'artist_123',
        plan: PlanTier.pro_plus,
        status: SubscriptionStatus.active,
        stripeCustomerId: 'cus_123',
        stripeSubscriptionId: 'sub_123',
        stripePriceId: 'price_pro_plus_456',
        cancelAtPeriodEnd: true,
        currentPeriodEnd: new Date('2024-04-01T00:00:00.000Z'),
        lastStripeEventAt: new Date('2026-04-08T21:20:00.000Z'),
      },
    });
  });

  it('syncs subscription data from invoice payment events', async () => {
    const { service, prisma, stripe } = createService();

    (stripe.webhooks.constructEvent as jest.Mock).mockReturnValue({
      id: 'evt_invoice_paid',
      created: 1775683200,
      type: 'invoice.payment_succeeded',
      data: {
        object: {
          object: 'invoice',
          id: 'in_123',
          subscription: 'sub_123',
        },
      },
    });

    (stripe.subscriptions.retrieve as jest.Mock).mockResolvedValue({
      object: 'subscription',
      id: 'sub_123',
      status: 'active',
      cancel_at_period_end: false,
      customer: 'cus_123',
      metadata: { artistId: 'artist_123', plan: PlanTier.pro },
      items: {
        data: [
          {
            current_period_end: 1711929600,
            price: {
              id: 'price_pro_123',
            },
          },
        ],
      },
    });

    await service.handleWebhook({
      headers: { 'stripe-signature': 'sig_123' },
      rawBody: Buffer.from('{}'),
    } as never);

    expect(stripe.subscriptions.retrieve).toHaveBeenCalledWith('sub_123');
    expect(prisma.subscription.upsert).toHaveBeenCalledWith({
      where: { artistId: 'artist_123' },
      update: {
        plan: PlanTier.pro,
        status: SubscriptionStatus.active,
        stripeCustomerId: 'cus_123',
        stripeSubscriptionId: 'sub_123',
        stripePriceId: 'price_pro_123',
        cancelAtPeriodEnd: false,
        currentPeriodEnd: new Date('2024-04-01T00:00:00.000Z'),
        lastStripeEventAt: new Date('2026-04-08T21:20:00.000Z'),
      },
      create: {
        artistId: 'artist_123',
        plan: PlanTier.pro,
        status: SubscriptionStatus.active,
        stripeCustomerId: 'cus_123',
        stripeSubscriptionId: 'sub_123',
        stripePriceId: 'price_pro_123',
        cancelAtPeriodEnd: false,
        currentPeriodEnd: new Date('2024-04-01T00:00:00.000Z'),
        lastStripeEventAt: new Date('2026-04-08T21:20:00.000Z'),
      },
    });
  });

  it('builds a billing summary with syncing state while Stripe webhook sync is pending', async () => {
    const { service, prisma, stripe } = createService();

    (prisma.subscription.upsert as jest.Mock).mockResolvedValue({
      artistId: 'artist_123',
      plan: PlanTier.pro,
      status: SubscriptionStatus.inactive,
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
      stripeCustomerId: 'cus_123',
    });

    (stripe.subscriptions.list as jest.Mock).mockResolvedValue({ data: [] });

    const result = await service.getBillingSummary('artist_123');

    expect(result.data.billingPlan).toBe('pro');
    expect(result.data.effectivePlan).toBe('free');
    expect(result.data.billingState).toBe('syncing');
    expect(result.data.notes.isWebhookSyncPending).toBe(true);
    expect(result.data.upgradeOptions.canManageBilling).toBe(true);
    expect(result.data.availablePlans.find((plan) => plan.planCode === 'pro')?.isCurrent).toBe(
      true,
    );
  });

  it('keeps syncing subscriptions conservative on read until an explicit refresh happens', async () => {
    const { service, prisma, stripe } = createService();

    (prisma.subscription.upsert as jest.Mock).mockResolvedValueOnce({
      artistId: 'artist_123',
      plan: PlanTier.pro,
      status: SubscriptionStatus.inactive,
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
      stripeCustomerId: 'cus_123',
      stripeSubscriptionId: 'sub_123',
    });

    const result = await service.getBillingSummary('artist_123');

    expect(result.data.billingPlan).toBe('pro');
    expect(result.data.effectivePlan).toBe('free');
    expect(result.data.billingState).toBe('syncing');
    expect(result.data.notes.isWebhookSyncPending).toBe(true);
    expect(stripe.subscriptions.retrieve).not.toHaveBeenCalled();
  });

  it('recommends Pro+ when the current effective access is Pro', async () => {
    const { service, prisma } = createService();

    (prisma.subscription.upsert as jest.Mock).mockResolvedValue({
      artistId: 'artist_123',
      plan: PlanTier.pro,
      status: SubscriptionStatus.active,
      currentPeriodEnd: new Date('2026-05-01T00:00:00.000Z'),
      cancelAtPeriodEnd: false,
      stripeCustomerId: 'cus_123',
    });

    const result = await service.getBillingSummary('artist_123');

    expect(result.data.effectivePlan).toBe('pro');
    expect(result.data.billingState).toBe('active');
    expect(result.data.upgradeOptions.recommendedPlan).toBe('pro_plus');
  });

  it('refreshes the subscription state directly from Stripe', async () => {
    const { service, prisma, stripe } = createService();

    (prisma.subscription.upsert as jest.Mock).mockResolvedValueOnce({
      artistId: 'artist_123',
      plan: PlanTier.pro,
      status: SubscriptionStatus.inactive,
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
      stripeCustomerId: 'cus_123',
      stripeSubscriptionId: 'sub_123',
    });

    (stripe.subscriptions.retrieve as jest.Mock).mockResolvedValue({
      object: 'subscription',
      id: 'sub_123',
      status: 'active',
      cancel_at_period_end: false,
      customer: 'cus_123',
      metadata: { artistId: 'artist_123', plan: PlanTier.pro },
      items: {
        data: [
          {
            current_period_end: 1711929600,
            price: {
              id: 'price_pro_123',
            },
          },
        ],
      },
    });

    (prisma.subscription.upsert as jest.Mock).mockResolvedValueOnce({
      artistId: 'artist_123',
      plan: PlanTier.pro,
      status: SubscriptionStatus.active,
      currentPeriodEnd: new Date('2024-04-01T00:00:00.000Z'),
      cancelAtPeriodEnd: false,
      stripeCustomerId: 'cus_123',
      stripeSubscriptionId: 'sub_123',
    });

    (prisma.subscription.upsert as jest.Mock).mockResolvedValueOnce({
      artistId: 'artist_123',
      plan: PlanTier.pro,
      status: SubscriptionStatus.active,
      currentPeriodEnd: new Date('2024-04-01T00:00:00.000Z'),
      cancelAtPeriodEnd: false,
      stripeCustomerId: 'cus_123',
      stripeSubscriptionId: 'sub_123',
    });

    const result = await service.refreshSubscriptionState('artist_123');

    expect(stripe.subscriptions.retrieve).toHaveBeenCalledWith('sub_123');
    expect(result.data.billingPlan).toBe('pro');
    expect(result.data.effectivePlan).toBe('pro');
    expect(result.data.billingState).toBe('active');
  });

  it('treats scheduled cancellation dates as canceling during refresh', async () => {
    const { service, prisma, stripe } = createService();

    (prisma.subscription.upsert as jest.Mock).mockResolvedValueOnce({
      artistId: 'artist_123',
      plan: PlanTier.pro,
      status: SubscriptionStatus.active,
      currentPeriodEnd: new Date('2024-04-01T00:00:00.000Z'),
      cancelAtPeriodEnd: false,
      stripeCustomerId: 'cus_123',
      stripeSubscriptionId: 'sub_123',
    });

    (stripe.subscriptions.retrieve as jest.Mock).mockResolvedValue({
      object: 'subscription',
      id: 'sub_123',
      status: 'active',
      cancel_at_period_end: false,
      cancel_at: 1711929600,
      customer: 'cus_123',
      metadata: { artistId: 'artist_123', plan: PlanTier.pro },
      items: {
        data: [
          {
            current_period_end: 1711929600,
            price: {
              id: 'price_pro_123',
            },
          },
        ],
      },
    });

    (prisma.subscription.upsert as jest.Mock).mockResolvedValueOnce({
      artistId: 'artist_123',
      plan: PlanTier.pro,
      status: SubscriptionStatus.active,
      currentPeriodEnd: new Date('2024-04-01T00:00:00.000Z'),
      cancelAtPeriodEnd: true,
      stripeCustomerId: 'cus_123',
      stripeSubscriptionId: 'sub_123',
    });

    (prisma.subscription.upsert as jest.Mock).mockResolvedValueOnce({
      artistId: 'artist_123',
      plan: PlanTier.pro,
      status: SubscriptionStatus.active,
      currentPeriodEnd: new Date('2024-04-01T00:00:00.000Z'),
      cancelAtPeriodEnd: true,
      stripeCustomerId: 'cus_123',
      stripeSubscriptionId: 'sub_123',
    });

    const result = await service.refreshSubscriptionState('artist_123');

    expect(result.data.cancelAtPeriodEnd).toBe(true);
    expect(result.data.billingState).toBe('canceling');
  });

  it('does not retain access after Stripe returns a canceled subscription with a future currentPeriodEnd', async () => {
    const { service, prisma, stripe } = createService();

    (prisma.subscription.upsert as jest.Mock).mockResolvedValueOnce({
      artistId: 'artist_123',
      plan: PlanTier.pro,
      status: SubscriptionStatus.past_due,
      currentPeriodEnd: new Date('2026-06-10T00:00:00.000Z'),
      cancelAtPeriodEnd: true,
      stripeCustomerId: 'cus_123',
      stripeSubscriptionId: 'sub_123',
    });

    (stripe.subscriptions.retrieve as jest.Mock).mockResolvedValue({
      object: 'subscription',
      id: 'sub_123',
      status: 'canceled',
      cancel_at_period_end: false,
      cancel_at: null,
      customer: 'cus_123',
      metadata: { artistId: 'artist_123', plan: PlanTier.pro },
      items: {
        data: [
          {
            current_period_end: 1781049600,
            price: {
              id: 'price_pro_123',
            },
          },
        ],
      },
    });

    (prisma.subscription.upsert as jest.Mock).mockResolvedValueOnce({
      artistId: 'artist_123',
      plan: PlanTier.pro,
      status: SubscriptionStatus.canceled,
      currentPeriodEnd: new Date('2026-06-10T00:00:00.000Z'),
      cancelAtPeriodEnd: false,
      stripeCustomerId: 'cus_123',
      stripeSubscriptionId: 'sub_123',
    });

    (prisma.subscription.upsert as jest.Mock).mockResolvedValueOnce({
      artistId: 'artist_123',
      plan: PlanTier.pro,
      status: SubscriptionStatus.canceled,
      currentPeriodEnd: new Date('2026-06-10T00:00:00.000Z'),
      cancelAtPeriodEnd: false,
      stripeCustomerId: 'cus_123',
      stripeSubscriptionId: 'sub_123',
    });

    const result = await service.refreshSubscriptionState('artist_123');

    expect(result.data.billingPlan).toBe('pro');
    expect(result.data.effectivePlan).toBe('free');
    expect(result.data.billingState).toBe('canceled');
    expect(result.data.cancelAtPeriodEnd).toBe(false);
  });

  it('ignores duplicated webhook events by Stripe event id', async () => {
    const { service, prisma, stripe } = createService();

    (prisma.stripeWebhookEvent.create as jest.Mock).mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('duplicate', {
        clientVersion: '5.22.0',
        code: 'P2002',
      }),
    );

    (stripe.webhooks.constructEvent as jest.Mock).mockReturnValue({
      id: 'evt_dup',
      type: 'customer.subscription.updated',
      data: {
        object: {
          object: 'subscription',
          id: 'sub_123',
          status: 'active',
          cancel_at_period_end: false,
          customer: 'cus_123',
          metadata: { artistId: 'artist_123', plan: PlanTier.pro },
          items: {
            data: [
              {
                current_period_end: 1711929600,
                price: {
                  id: 'price_pro_123',
                },
              },
            ],
          },
        },
      },
    });

    await service.handleWebhook({
      headers: { 'stripe-signature': 'sig_123' },
      rawBody: Buffer.from('{}'),
    } as never);

    expect(prisma.subscription.upsert).not.toHaveBeenCalled();
  });

  it('skips stale webhook events that arrive out of order', async () => {
    const { service, prisma, stripe } = createService();

    prisma.subscription.findUnique.mockResolvedValue({
      lastStripeEventAt: new Date('2026-04-09T12:00:00.000Z'),
    });

    (stripe.webhooks.constructEvent as jest.Mock).mockReturnValue({
      id: 'evt_old',
      created: 1775600000,
      type: 'customer.subscription.updated',
      data: {
        object: {
          object: 'subscription',
          id: 'sub_123',
          status: 'active',
          cancel_at_period_end: false,
          customer: 'cus_123',
          metadata: { artistId: 'artist_123', plan: PlanTier.pro },
          items: {
            data: [
              {
                current_period_end: 1711929600,
                price: {
                  id: 'price_pro_123',
                },
              },
            ],
          },
        },
      },
    });

    await service.handleWebhook({
      headers: { 'stripe-signature': 'sig_123' },
      rawBody: Buffer.from('{}'),
    } as never);

    expect(prisma.subscription.upsert).not.toHaveBeenCalled();
  });
});
