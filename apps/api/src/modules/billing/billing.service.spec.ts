import { BadRequestException } from '@nestjs/common';
import { PlanTier, Prisma, SubscriptionStatus } from '@prisma/client';
import { BillingService } from './billing.service';

describe('BillingService', () => {
  interface PrismaMock {
    $transaction: jest.Mock<Promise<unknown>, [(tx: PrismaMock) => Promise<unknown>]>;
    subscription: {
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
      webhooks: {
        constructEvent: jest.fn(),
      },
      subscriptions: {
        retrieve: jest.fn(),
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
      },
    });
  });

  it('syncs subscription data from invoice payment events', async () => {
    const { service, prisma, stripe } = createService();

    (stripe.webhooks.constructEvent as jest.Mock).mockReturnValue({
      id: 'evt_invoice_paid',
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
      },
    });
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
});
