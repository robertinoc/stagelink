import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  PlanTier,
  Prisma,
  type Subscription as PrismaSubscription,
  type User,
} from '@prisma/client';
import type { Request } from 'express';
import type Stripe from 'stripe';
import { PrismaService } from '../../lib/prisma.service';
import { ok } from '../../common/utils/response.util';
import type { CreateCheckoutSessionDto, CreatePortalSessionDto } from './dto';
import {
  getPlanFromStripePriceId,
  getStripePriceIdForPlan,
  mapStripeSubscriptionStatus,
  normalizeStripeTimestamp,
  PAID_BILLING_PLANS,
} from './billing.helpers';

export const STRIPE_CLIENT = Symbol('STRIPE_CLIENT');

export interface BillingPlanCatalogItem {
  plan: PlanTier | 'enterprise';
  available: boolean;
  contactSales?: boolean;
  priceId: string | null;
  amount: number | null;
  currency: string | null;
  interval: string | null;
  productId: string | null;
  productName: string;
  productDescription: string | null;
}

interface StripeRequest extends Request {
  rawBody?: Buffer;
}

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    @Inject(STRIPE_CLIENT) private readonly stripe: Stripe | null,
  ) {}

  async getProducts() {
    const plans = await Promise.all([
      this.buildFreePlanCatalogItem(),
      this.buildPaidPlanCatalogItem(PlanTier.pro),
      this.buildPaidPlanCatalogItem(PlanTier.pro_plus),
      Promise.resolve({
        plan: 'enterprise' as const,
        available: false,
        contactSales: true,
        priceId: null,
        amount: null,
        currency: null,
        interval: null,
        productId: null,
        productName: 'Enterprise',
        productDescription: 'Manual onboarding for custom needs.',
      }),
    ]);

    return ok({ plans });
  }

  async getSubscription(artistId: string) {
    const subscription = await this.ensureSubscriptionRecord(artistId);

    return ok({
      plan: subscription.plan,
      status: subscription.status,
      currentPeriodEnd: subscription.currentPeriodEnd,
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
      portalAvailable: Boolean(subscription.stripeCustomerId),
    });
  }

  async createCheckoutSession(artistId: string, dto: CreateCheckoutSessionDto, user: User) {
    if (!PAID_BILLING_PLANS.includes(dto.plan)) {
      throw new BadRequestException('Checkout is only available for paid plans');
    }

    const stripe = this.getStripeClientOrThrow();
    const returnUrl = this.validateReturnUrl(dto.returnUrl);
    const priceId = getStripePriceIdForPlan(dto.plan, this.getPriceConfig());

    if (!priceId) {
      throw new ServiceUnavailableException(`Stripe price not configured for plan "${dto.plan}"`);
    }

    const artist = await this.prisma.artist.findUnique({
      where: { id: artistId },
      include: {
        user: {
          select: {
            email: true,
          },
        },
        subscription: true,
      },
    });

    if (!artist) {
      throw new NotFoundException('Artist not found');
    }

    const customerId = await this.ensureStripeCustomer(artist.subscription, {
      artistId: artist.id,
      displayName: artist.displayName,
      email: artist.contactEmail ?? artist.user.email ?? user.email,
      initiatingUserId: user.id,
      username: artist.username,
    });

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      client_reference_id: artist.id,
      success_url: this.appendBillingState(returnUrl, 'success'),
      cancel_url: this.appendBillingState(returnUrl, 'canceled'),
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      allow_promotion_codes: true,
      metadata: {
        artistId: artist.id,
        plan: dto.plan,
        username: artist.username,
        initiatingUserId: user.id,
        environment: this.getBillingEnvironment(),
      },
      subscription_data: {
        metadata: {
          artistId: artist.id,
          plan: dto.plan,
          username: artist.username,
          initiatingUserId: user.id,
          environment: this.getBillingEnvironment(),
        },
      },
    });

    if (!session.url) {
      throw new ServiceUnavailableException('Stripe did not return a checkout URL');
    }

    await this.prisma.subscription.upsert({
      where: { artistId },
      update: {
        plan: dto.plan,
        stripeCustomerId: customerId,
        stripePriceId: priceId,
      },
      create: {
        artistId,
        plan: dto.plan,
        stripeCustomerId: customerId,
        stripePriceId: priceId,
      },
    });

    return ok({ url: session.url });
  }

  async createPortalSession(artistId: string, dto: CreatePortalSessionDto) {
    const stripe = this.getStripeClientOrThrow();
    const returnUrl = this.validateReturnUrl(dto.returnUrl);
    const subscription = await this.ensureSubscriptionRecord(artistId);

    if (!subscription.stripeCustomerId) {
      throw new BadRequestException('No Stripe customer exists for this artist yet');
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: subscription.stripeCustomerId,
      return_url: returnUrl,
    });

    return ok({ url: session.url });
  }

  async handleWebhook(req: StripeRequest) {
    const stripe = this.getStripeClientOrThrow();
    const webhookSecret = this.configService.get<string>('stripe.webhookSecret');
    const signature = req.headers['stripe-signature'];

    if (!webhookSecret) {
      throw new ServiceUnavailableException('Stripe webhook secret is not configured');
    }

    if (!signature || Array.isArray(signature)) {
      throw new BadRequestException('Missing Stripe signature header');
    }

    if (!req.rawBody) {
      throw new BadRequestException('Stripe raw request body is not available');
    }

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(req.rawBody, signature, webhookSecret);
    } catch (error) {
      this.logger.warn(
        `Stripe webhook verification failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw new BadRequestException('Invalid Stripe webhook signature');
    }

    switch (event.type) {
      case 'checkout.session.completed':
        await this.handleCheckoutCompleted(
          event.id,
          event.type,
          event.data.object as Stripe.Checkout.Session,
        );
        break;
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
      case 'invoice.paid':
      case 'invoice.payment_failed':
        await this.handleSubscriptionBackedEvent(
          event.id,
          event.type,
          event.data.object as Stripe.Subscription | Stripe.Invoice,
        );
        break;
      default:
        break;
    }

    return ok({ received: true, eventId: event.id, eventType: event.type });
  }

  private async buildFreePlanCatalogItem(): Promise<BillingPlanCatalogItem> {
    return {
      plan: PlanTier.free,
      available: true,
      priceId: null,
      amount: 0,
      currency: 'usd',
      interval: 'month',
      productId: null,
      productName: 'Free',
      productDescription: 'Basic public page for getting started.',
    };
  }

  private async buildPaidPlanCatalogItem(plan: PlanTier): Promise<BillingPlanCatalogItem> {
    const priceId = getStripePriceIdForPlan(plan, this.getPriceConfig());
    if (!priceId || !this.stripe) {
      return {
        plan,
        available: false,
        priceId: priceId ?? null,
        amount: null,
        currency: null,
        interval: null,
        productId: null,
        productName: plan === PlanTier.pro ? 'Pro' : 'Pro+',
        productDescription: null,
      };
    }

    const price = await this.stripe.prices.retrieve(priceId, { expand: ['product'] });
    const product =
      typeof price.product === 'string' ? null : ((price.product as Stripe.Product | null) ?? null);

    return {
      plan,
      available: price.active,
      priceId: price.id,
      amount: price.unit_amount,
      currency: price.currency,
      interval: price.recurring?.interval ?? null,
      productId: product?.id ?? null,
      productName: product?.name ?? (plan === PlanTier.pro ? 'Pro' : 'Pro+'),
      productDescription: product?.description ?? null,
    };
  }

  private getStripeClientOrThrow(): Stripe {
    if (!this.stripe) {
      throw new ServiceUnavailableException('Stripe is not configured');
    }

    return this.stripe;
  }

  private getPriceConfig() {
    return {
      proPriceId: this.configService.get<string>('stripe.proPriceId'),
      proPlusPriceId: this.configService.get<string>('stripe.proPlusPriceId'),
    };
  }

  private getBillingEnvironment(): string {
    return (
      process.env['APP_ENV'] ??
      this.configService.get<string>('app.nodeEnv') ??
      process.env['NODE_ENV'] ??
      'development'
    );
  }

  private validateReturnUrl(rawUrl: string): string {
    const frontendUrl =
      this.configService.get<string>('app.frontendUrl') ?? 'http://localhost:4000';
    const allowedOrigins = [new URL(frontendUrl).origin];
    const extraOrigins = (this.configService.get<string>('app.corsAllowedOrigins') ?? '')
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean)
      .map((origin) => new URL(origin).origin);

    allowedOrigins.push(...extraOrigins);

    const url = new URL(rawUrl);
    if (!allowedOrigins.includes(url.origin)) {
      throw new BadRequestException('Return URL origin is not allowed');
    }

    return url.toString();
  }

  private appendBillingState(returnUrl: string, checkoutState: 'success' | 'canceled'): string {
    const url = new URL(returnUrl);
    url.searchParams.set('checkout', checkoutState);
    return url.toString();
  }

  private async ensureSubscriptionRecord(artistId: string): Promise<PrismaSubscription> {
    return this.prisma.subscription.upsert({
      where: { artistId },
      update: {},
      create: {
        artistId,
        plan: PlanTier.free,
      },
    });
  }

  private async ensureStripeCustomer(
    existingSubscription: PrismaSubscription | null,
    payload: {
      artistId: string;
      displayName: string;
      email: string;
      initiatingUserId?: string;
      username: string;
    },
  ): Promise<string> {
    if (existingSubscription?.stripeCustomerId) {
      return existingSubscription.stripeCustomerId;
    }

    const stripe = this.getStripeClientOrThrow();
    const customer = await stripe.customers.create({
      email: payload.email,
      name: payload.displayName,
      metadata: {
        artistId: payload.artistId,
        environment: this.getBillingEnvironment(),
        initiatingUserId: payload.initiatingUserId ?? '',
        username: payload.username,
      },
    });

    return customer.id;
  }

  private async handleCheckoutCompleted(
    stripeEventId: string,
    stripeEventType: string,
    session: Stripe.Checkout.Session,
  ) {
    const artistId = session.metadata?.artistId ?? session.client_reference_id;
    if (!artistId) {
      this.logger.warn(`checkout.session.completed ${session.id} missing artist metadata`);
      return;
    }

    if (!(await this.tryRegisterWebhookEvent(stripeEventId, stripeEventType, artistId))) {
      return;
    }

    const plan = this.resolvePlan(session.metadata?.plan, null);

    await this.prisma.subscription.upsert({
      where: { artistId },
      update: {
        ...(plan ? { plan } : {}),
        ...(typeof session.customer === 'string' ? { stripeCustomerId: session.customer } : {}),
        ...(typeof session.subscription === 'string'
          ? { stripeSubscriptionId: session.subscription }
          : {}),
      },
      create: {
        artistId,
        plan: plan ?? PlanTier.free,
        ...(typeof session.customer === 'string' ? { stripeCustomerId: session.customer } : {}),
        ...(typeof session.subscription === 'string'
          ? { stripeSubscriptionId: session.subscription }
          : {}),
      },
    });
  }

  private async handleSubscriptionBackedEvent(
    stripeEventId: string,
    stripeEventType: string,
    payload: Stripe.Subscription | Stripe.Invoice,
  ) {
    const subscription = await this.extractSubscriptionFromPayload(payload);
    if (!subscription) {
      this.logger.warn(`${stripeEventType} missing subscription payload`);
      return;
    }

    await this.syncStripeSubscription(stripeEventId, stripeEventType, subscription);
  }

  private async extractSubscriptionFromPayload(
    payload: Stripe.Subscription | Stripe.Invoice,
  ): Promise<Stripe.Subscription | null> {
    if ('object' in payload && payload.object === 'subscription') {
      return payload;
    }

    if ('subscription' in payload && payload.subscription) {
      if (typeof payload.subscription === 'string') {
        return this.getStripeClientOrThrow().subscriptions.retrieve(payload.subscription);
      }

      return payload.subscription as Stripe.Subscription;
    }

    return null;
  }

  private async syncStripeSubscription(
    stripeEventId: string,
    stripeEventType: string,
    subscription: Stripe.Subscription,
  ) {
    const item = subscription.items.data[0];
    const plan = this.resolvePlan(subscription.metadata?.plan, item?.price?.id ?? null);
    const artistId = await this.resolveArtistIdForStripeSubscription(subscription);

    if (!artistId) {
      this.logger.warn(`Unable to resolve artist for Stripe subscription ${subscription.id}`);
      return;
    }

    if (!(await this.tryRegisterWebhookEvent(stripeEventId, stripeEventType, artistId))) {
      return;
    }

    await this.prisma.subscription.upsert({
      where: { artistId },
      update: {
        plan,
        status: mapStripeSubscriptionStatus(subscription.status),
        stripeCustomerId:
          typeof subscription.customer === 'string'
            ? subscription.customer
            : subscription.customer.id,
        stripeSubscriptionId: subscription.id,
        stripePriceId: item?.price?.id ?? null,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        currentPeriodEnd: normalizeStripeTimestamp(item?.current_period_end ?? null),
      },
      create: {
        artistId,
        plan,
        status: mapStripeSubscriptionStatus(subscription.status),
        stripeCustomerId:
          typeof subscription.customer === 'string'
            ? subscription.customer
            : subscription.customer.id,
        stripeSubscriptionId: subscription.id,
        stripePriceId: item?.price?.id ?? null,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        currentPeriodEnd: normalizeStripeTimestamp(item?.current_period_end ?? null),
      },
    });
  }

  private resolvePlan(metadataPlan: string | undefined, stripePriceId: string | null): PlanTier {
    if (metadataPlan === PlanTier.pro || metadataPlan === PlanTier.pro_plus) {
      return metadataPlan;
    }

    return getPlanFromStripePriceId(stripePriceId, this.getPriceConfig()) ?? PlanTier.free;
  }

  private async resolveArtistIdForStripeSubscription(
    subscription: Stripe.Subscription,
  ): Promise<string | null> {
    if (subscription.metadata?.artistId) {
      return subscription.metadata.artistId;
    }

    const customerId =
      typeof subscription.customer === 'string' ? subscription.customer : subscription.customer.id;

    const existing = await this.prisma.subscription.findFirst({
      where: {
        OR: [{ stripeSubscriptionId: subscription.id }, { stripeCustomerId: customerId }],
      },
      select: { artistId: true },
    });

    return existing?.artistId ?? null;
  }

  private async tryRegisterWebhookEvent(
    stripeEventId: string,
    stripeEventType: string,
    artistId: string | null,
  ): Promise<boolean> {
    try {
      const prismaStripeWebhookEvent = (
        this.prisma as PrismaService & {
          stripeWebhookEvent: {
            create: (args: {
              data: {
                stripeEventId: string;
                stripeEventType: string;
                artistId: string | null;
              };
            }) => Promise<unknown>;
          };
        }
      ).stripeWebhookEvent;

      await prismaStripeWebhookEvent.create({
        data: {
          stripeEventId,
          stripeEventType,
          artistId,
        },
      });

      return true;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        this.logger.log(`Skipping duplicate Stripe webhook event ${stripeEventId}`);
        return false;
      }

      throw error;
    }
  }
}
