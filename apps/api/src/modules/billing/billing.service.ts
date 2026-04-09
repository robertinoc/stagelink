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
  SubscriptionStatus,
  type Subscription as PrismaSubscription,
  type User,
} from '@prisma/client';
import {
  buildBillingMessages,
  buildTenantEntitlements,
  FEATURE_KEYS,
  getMinimumPlanForFeature,
  isBillingSyncPending,
  PLAN_FEATURE_MATRIX,
  resolveBillingUiState,
  type BillingFeatureSummary,
  type BillingPlanSummary,
  type BillingUiSummary,
} from '@stagelink/types';
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
  amount: number | null;
  currency: string | null;
  interval: string | null;
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
    const plans = await this.getProductsCatalog();

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

  async getBillingSummary(artistId: string) {
    const subscription = await this.ensureSubscriptionRecord(artistId);
    const now = new Date();

    const products = await this.getProductsCatalog();

    const snapshot = {
      plan: subscription.plan,
      status: subscription.status,
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
      currentPeriodEnd: subscription.currentPeriodEnd,
    };
    const entitlements = buildTenantEntitlements(snapshot);
    const billingState = resolveBillingUiState(snapshot, now);
    const billingSyncPending = isBillingSyncPending(snapshot);
    const billingMessages = buildBillingMessages(snapshot, now);
    const availablePlans = this.buildPlanSummaries(
      products,
      subscription,
      entitlements.effectivePlan,
    );
    const featureHighlights = this.buildFeatureHighlights(entitlements.effectivePlan);
    const recommendedPlan = availablePlans.find(
      (plan) =>
        plan.recommended && !plan.isCurrent && plan.planCode !== 'enterprise' && plan.available,
    );

    return ok<BillingUiSummary>({
      artistId,
      effectivePlan: entitlements.effectivePlan,
      billingPlan: entitlements.billingPlan,
      subscriptionStatus: entitlements.subscriptionStatus,
      currentPeriodEnd: subscription.currentPeriodEnd?.toISOString() ?? null,
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
      effectiveBillingState: billingState,
      billingState,
      billingSyncPending,
      billingMessages,
      availablePlans,
      entitlements: entitlements.features,
      featureHighlights,
      upgradeOptions: {
        canUpgrade: availablePlans.some(
          (plan) =>
            plan.planCode !== 'enterprise' &&
            plan.available &&
            !plan.isCurrent &&
            this.planRank(plan.planCode) > this.planRank(entitlements.effectivePlan),
        ),
        canManageBilling: Boolean(subscription.stripeCustomerId),
        recommendedPlan:
          recommendedPlan?.planCode && recommendedPlan.planCode !== 'enterprise'
            ? recommendedPlan.planCode
            : null,
      },
      notes: {
        isWebhookSyncPending: billingSyncPending,
      },
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
        stripeCustomerId: customerId,
      },
      create: {
        artistId,
        plan: PlanTier.free,
        status: SubscriptionStatus.inactive,
        stripeCustomerId: customerId,
      },
    });

    return ok({ url: session.url });
  }

  async createPortalSession(artistId: string, dto: CreatePortalSessionDto) {
    const stripe = this.getStripeClientOrThrow();
    const returnUrl = this.appendPortalState(this.validateReturnUrl(dto.returnUrl));
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

  async refreshSubscriptionState(artistId: string) {
    const subscription = await this.ensureSubscriptionRecord(artistId);
    await this.reconcileSubscriptionFromStripe(artistId, subscription);

    return this.getBillingSummary(artistId);
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
          new Date(event.created * 1000),
          event.data.object as Stripe.Checkout.Session,
        );
        break;
      case 'invoice.paid':
      case 'invoice.payment_succeeded':
        await this.handleInvoiceBackedEvent(
          event.id,
          event.type,
          new Date(event.created * 1000),
          event.data.object as Stripe.Invoice,
        );
        break;
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        await this.handleSubscriptionBackedEvent(
          event.id,
          event.type,
          new Date(event.created * 1000),
          event.data.object as Stripe.Subscription,
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
      amount: 0,
      currency: 'usd',
      interval: 'month',
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
        amount: null,
        currency: null,
        interval: null,
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
      amount: price.unit_amount,
      currency: price.currency,
      interval: price.recurring?.interval ?? null,
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

  private appendPortalState(returnUrl: string): string {
    const url = new URL(returnUrl);
    url.searchParams.set('portal', 'returned');
    return url.toString();
  }

  private async getProductsCatalog(): Promise<BillingPlanCatalogItem[]> {
    return Promise.all([
      this.buildFreePlanCatalogItem(),
      this.buildPaidPlanCatalogItem(PlanTier.pro),
      this.buildPaidPlanCatalogItem(PlanTier.pro_plus),
      Promise.resolve({
        plan: 'enterprise' as const,
        available: false,
        contactSales: true,
        amount: null,
        currency: null,
        interval: null,
        productName: 'Enterprise',
        productDescription: 'Manual onboarding for custom needs.',
      }),
    ]);
  }

  private buildPlanSummaries(
    products: BillingPlanCatalogItem[],
    subscription: PrismaSubscription,
    effectivePlan: PlanTier,
  ): BillingPlanSummary[] {
    return products.map((product) => ({
      planCode: product.plan,
      displayName: product.productName,
      interval: product.interval,
      priceDisplay: this.formatPriceDisplay(product.amount, product.currency, product.contactSales),
      available: product.available,
      recommended:
        (product.plan === 'pro' && effectivePlan === 'free') ||
        (product.plan === 'pro_plus' && effectivePlan === 'pro'),
      contactSales: Boolean(product.contactSales),
      isCurrent: product.plan === subscription.plan,
      features:
        product.plan === 'enterprise'
          ? [...PLAN_FEATURE_MATRIX.pro_plus]
          : [...PLAN_FEATURE_MATRIX[product.plan]],
    }));
  }

  private buildFeatureHighlights(currentPlan: PlanTier): BillingFeatureSummary[] {
    return FEATURE_KEYS.map((feature) => ({
      feature,
      included: PLAN_FEATURE_MATRIX[currentPlan].includes(feature),
      requiredPlan: getMinimumPlanForFeature(feature),
    }));
  }

  private formatPriceDisplay(
    amount: number | null,
    currency: string | null,
    contactSales?: boolean,
  ): string {
    if (contactSales) return 'Custom';
    if (amount === null || currency === null) return 'Unavailable';

    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
      minimumFractionDigits: 0,
    }).format(amount / 100);
  }

  private planRank(plan: PlanTier): number {
    switch (plan) {
      case 'pro':
        return 1;
      case 'pro_plus':
        return 2;
      default:
        return 0;
    }
  }

  private async ensureSubscriptionRecord(artistId: string): Promise<PrismaSubscription> {
    return this.prisma.subscription.upsert({
      where: { artistId },
      update: {},
      create: {
        artistId,
        plan: PlanTier.free,
        status: SubscriptionStatus.inactive,
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
    stripeEventAt: Date,
    session: Stripe.Checkout.Session,
  ) {
    const artistId = session.metadata?.artistId ?? session.client_reference_id;
    if (!artistId) {
      this.logger.warn(`checkout.session.completed ${session.id} missing artist metadata`);
      return;
    }

    const plan = this.resolvePlan(session.metadata?.plan, null);
    if (!plan) {
      this.logger.error(`checkout.session.completed ${session.id} has unknown plan metadata`);
      return;
    }

    await this.runWebhookMutation(
      stripeEventId,
      stripeEventType,
      stripeEventAt,
      artistId,
      async (tx) => {
        const existing = await tx.subscription.findUnique({ where: { artistId } });
        const preserveExistingAccess =
          existing &&
          (existing.status === SubscriptionStatus.active ||
            existing.status === SubscriptionStatus.trialing);

        if (existing) {
          await tx.subscription.update({
            where: { artistId },
            data: {
              plan: preserveExistingAccess ? existing.plan : plan,
              status: preserveExistingAccess ? existing.status : SubscriptionStatus.incomplete,
              ...(typeof session.customer === 'string'
                ? { stripeCustomerId: session.customer }
                : {}),
              ...(typeof session.subscription === 'string'
                ? { stripeSubscriptionId: session.subscription }
                : {}),
              lastStripeEventAt: stripeEventAt,
            },
          });
          return;
        }

        await tx.subscription.create({
          data: {
            artistId,
            plan,
            status: SubscriptionStatus.incomplete,
            ...(typeof session.customer === 'string' ? { stripeCustomerId: session.customer } : {}),
            ...(typeof session.subscription === 'string'
              ? { stripeSubscriptionId: session.subscription }
              : {}),
            lastStripeEventAt: stripeEventAt,
          },
        });
      },
    );
  }

  private async handleSubscriptionBackedEvent(
    stripeEventId: string,
    stripeEventType: string,
    stripeEventAt: Date,
    subscription: Stripe.Subscription,
  ) {
    await this.syncStripeSubscription(stripeEventId, stripeEventType, stripeEventAt, subscription);
  }

  private async handleInvoiceBackedEvent(
    stripeEventId: string,
    stripeEventType: string,
    stripeEventAt: Date,
    invoice: Stripe.Invoice,
  ) {
    const invoiceWithSubscription = invoice as Stripe.Invoice & {
      subscription?: string | Stripe.Subscription | null;
    };
    const subscriptionId =
      typeof invoiceWithSubscription.subscription === 'string'
        ? invoiceWithSubscription.subscription
        : invoiceWithSubscription.subscription?.id;

    if (!subscriptionId) {
      this.logger.warn(`${stripeEventType} ${invoice.id} missing subscription reference`);
      return;
    }

    const stripe = this.getStripeClientOrThrow();
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    await this.syncStripeSubscription(stripeEventId, stripeEventType, stripeEventAt, subscription);
  }

  private async syncStripeSubscription(
    stripeEventId: string,
    stripeEventType: string,
    stripeEventAt: Date,
    subscription: Stripe.Subscription,
  ) {
    const item = subscription.items.data[0];
    const plan = this.resolvePlan(subscription.metadata?.plan, item?.price?.id ?? null);
    const artistId = await this.resolveArtistIdForStripeSubscription(subscription);

    if (!artistId) {
      this.logger.warn(`Unable to resolve artist for Stripe subscription ${subscription.id}`);
      return;
    }

    if (!plan) {
      this.logger.error(`Unknown Stripe plan mapping for subscription ${subscription.id}`);
      return;
    }

    await this.runWebhookMutation(
      stripeEventId,
      stripeEventType,
      stripeEventAt,
      artistId,
      async (tx) => {
        const write = this.buildStripeSubscriptionWrite(
          artistId,
          plan,
          subscription,
          stripeEventAt,
        );
        await tx.subscription.upsert({
          where: { artistId },
          update: write.update,
          create: write.create,
        });
      },
    );
  }

  private async reconcileSubscriptionFromStripe(
    artistId: string,
    subscription: PrismaSubscription,
  ): Promise<PrismaSubscription> {
    const stripe = this.getStripeClientOrThrow();

    let stripeSubscription: Stripe.Subscription | null = null;

    if (subscription.stripeSubscriptionId) {
      stripeSubscription = await stripe.subscriptions.retrieve(subscription.stripeSubscriptionId);
    } else if (subscription.stripeCustomerId) {
      const subscriptions = await stripe.subscriptions.list({
        customer: subscription.stripeCustomerId,
        status: 'all',
        limit: 1,
      });

      stripeSubscription = subscriptions.data[0] ?? null;
    }

    if (!stripeSubscription) {
      return this.prisma.subscription.update({
        where: { artistId },
        data: {
          plan: PlanTier.free,
          status: SubscriptionStatus.inactive,
          stripeSubscriptionId: null,
          stripePriceId: null,
          cancelAtPeriodEnd: false,
          currentPeriodEnd: null,
          lastStripeEventAt: new Date(),
        },
      });
    }

    const plan = this.resolvePlan(
      stripeSubscription.metadata?.plan,
      stripeSubscription.items.data[0]?.price?.id ?? null,
    );
    if (!plan) {
      this.logger.error(`Unknown Stripe plan mapping for subscription ${stripeSubscription.id}`);
      return subscription;
    }

    const resolvedArtistId = await this.resolveArtistIdForStripeSubscription(stripeSubscription);
    if (resolvedArtistId && resolvedArtistId !== artistId) {
      this.logger.warn(
        `Stripe reconciliation for ${artistId} resolved to different artist ${resolvedArtistId}`,
      );
      return subscription;
    }

    const write = this.buildStripeSubscriptionWrite(artistId, plan, stripeSubscription);
    return this.prisma.subscription.upsert({
      where: { artistId },
      update: write.update,
      create: write.create,
    });
  }

  private buildStripeSubscriptionWrite(
    artistId: string,
    plan: PlanTier,
    subscription: Stripe.Subscription,
    stripeEventAt: Date = new Date(),
  ) {
    const item = subscription.items.data[0];

    return {
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
        lastStripeEventAt: stripeEventAt,
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
        lastStripeEventAt: stripeEventAt,
      },
    };
  }

  private resolvePlan(
    metadataPlan: string | undefined,
    stripePriceId: string | null,
  ): PlanTier | null {
    if (metadataPlan === PlanTier.pro || metadataPlan === PlanTier.pro_plus) {
      return metadataPlan;
    }

    return getPlanFromStripePriceId(stripePriceId, this.getPriceConfig());
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

  private async runWebhookMutation(
    stripeEventId: string,
    stripeEventType: string,
    stripeEventAt: Date,
    artistId: string | null,
    mutate: (
      tx: Prisma.TransactionClient & {
        subscription: PrismaService['subscription'];
        stripeWebhookEvent: {
          create: (args: {
            data: {
              stripeEventId: string;
              stripeEventType: string;
              artistId: string | null;
              stripeEventAt: Date;
            };
          }) => Promise<unknown>;
        };
      },
    ) => Promise<void>,
  ): Promise<boolean> {
    try {
      await this.prisma.$transaction(async (tx) => {
        const typedTx = tx as Prisma.TransactionClient & {
          subscription: PrismaService['subscription'];
          stripeWebhookEvent: {
            create: (args: {
              data: {
                stripeEventId: string;
                stripeEventType: string;
                artistId: string | null;
                stripeEventAt: Date;
              };
            }) => Promise<unknown>;
          };
        };

        await typedTx.stripeWebhookEvent.create({
          data: {
            stripeEventId,
            stripeEventType,
            artistId,
            stripeEventAt,
          },
        });

        if (artistId) {
          const existing = await typedTx.subscription.findUnique({
            where: { artistId },
            select: { lastStripeEventAt: true },
          });

          if (
            existing?.lastStripeEventAt &&
            stripeEventAt.getTime() < existing.lastStripeEventAt.getTime()
          ) {
            this.logger.log(`Skipping stale Stripe webhook event ${stripeEventId} for ${artistId}`);
            return;
          }
        }

        await mutate(typedTx);
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
