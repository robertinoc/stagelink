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
  resolveEffectiveAccess,
  type BillingFeatureSummary,
  type BillingPlanSummary,
  type BillingUiSummary,
  type PlanCode,
} from '@stagelink/types';
import type { Request } from 'express';
import type Stripe from 'stripe';
import { PrismaService } from '../../lib/prisma.service';
import { ok } from '../../common/utils/response.util';
import { EmailService } from '../email/email.service';
import type { CreateCheckoutSessionDto, CreatePortalSessionDto } from './dto';
import {
  getPlanFromStripePriceId,
  getStripePriceIdForPlan,
  mapStripeSubscriptionStatus,
  normalizeStripeTimestamp,
  PAID_BILLING_PLANS,
} from './billing.helpers';

export const STRIPE_CLIENT = Symbol('STRIPE_CLIENT');
export const STRIPE_WEBHOOK_TOLERANCE_SECONDS = 300;

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

  /**
   * In-process memoization for `getProductsCatalog()`. Static (per-process)
   * because the catalog reflects Stripe product/price metadata that's the
   * same for every artist. A 5-min TTL keeps the dashboard fresh enough
   * for human-visible price updates while collapsing the per-request
   * Stripe API hop on every `getBillingSummary` call into one fetch per
   * 5-minute window per process.
   *
   * Vercel function instances are short-lived, so cold starts naturally
   * re-fetch. No external invalidation needed.
   */
  private static readonly PRODUCTS_CATALOG_TTL_MS = 5 * 60 * 1000;
  private static productsCatalogCache: {
    value: BillingPlanCatalogItem[];
    expiresAt: number;
  } | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    @Inject(STRIPE_CLIENT) private readonly stripe: Stripe | null,
    private readonly emailService: EmailService,
  ) {}

  /**
   * Automatically grants a 30-day Pro+ trial to every new artist at signup.
   * Called fire-and-forget from ArtistsService.create() — never throws outward.
   */
  async grantSignupTrial(artistId: string): Promise<void> {
    const now = new Date();
    const expiresAt = new Date(now);
    expiresAt.setDate(expiresAt.getDate() + 30);

    await this.prisma.subscription.upsert({
      where: { artistId },
      create: {
        artistId,
        plan: PlanTier.free,
        status: SubscriptionStatus.inactive,
        manualAccessPlan: PlanTier.pro_plus,
        manualAccessStartsAt: now,
        manualAccessExpiresAt: expiresAt,
        manualAccessReason: 'signup_trial',
        manualAccessGrantedBy: 'system',
      },
      update: {
        manualAccessPlan: PlanTier.pro_plus,
        manualAccessStartsAt: now,
        manualAccessExpiresAt: expiresAt,
        manualAccessReason: 'signup_trial',
        manualAccessGrantedBy: 'system',
      },
    });
  }

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

    // Fold in any active manual admin grant. This only ever raises the
    // effective plan — commercial billingPlan / status are unchanged.
    const access = resolveEffectiveAccess(
      snapshot,
      {
        manualAccessPlan: (subscription.manualAccessPlan as PlanCode | null) ?? null,
        manualAccessStartsAt: subscription.manualAccessStartsAt,
        manualAccessExpiresAt: subscription.manualAccessExpiresAt,
        manualAccessReason: subscription.manualAccessReason,
        manualAccessGrantedBy: subscription.manualAccessGrantedBy,
      },
      now,
    );
    const effectivePlan = access.effectiveAccess;

    const isPaymentPastDue =
      entitlements.subscriptionStatus === 'past_due' ||
      entitlements.subscriptionStatus === 'unpaid';
    const recommendedCheckoutPlan = this.resolveRecommendedCheckoutPlan(
      products,
      this.resolveCheckoutBasePlan(subscription),
      isPaymentPastDue,
    );
    const availablePlans = this.buildPlanSummaries(products, subscription, recommendedCheckoutPlan);
    const featureHighlights = this.buildFeatureHighlights(effectivePlan);

    // Feature availability must reflect the (possibly elevated) effective
    // plan so the dashboard unlocks features under a manual grant.
    const elevatedEntitlements = buildTenantEntitlements({
      plan: effectivePlan,
      status: 'active',
      cancelAtPeriodEnd: false,
      currentPeriodEnd: null,
    });

    // Compute manualAccessExpiringInDays: days until grant expiry if ≤ 14 days away.
    let manualAccessExpiringInDays: number | null = null;
    if (access.isManualGrantActive && access.manualAccessExpiresAt) {
      const msLeft = access.manualAccessExpiresAt.getTime() - now.getTime();
      const daysLeft = Math.ceil(msLeft / (1000 * 60 * 60 * 24));
      if (daysLeft <= 14 && daysLeft > 0) {
        manualAccessExpiringInDays = daysLeft;
      }
    }

    return ok<BillingUiSummary>({
      artistId,
      effectivePlan,
      billingPlan: entitlements.billingPlan,
      subscriptionStatus: entitlements.subscriptionStatus,
      currentPeriodEnd: subscription.currentPeriodEnd?.toISOString() ?? null,
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
      effectiveBillingState: billingState,
      billingState,
      billingSyncPending,
      billingMessages,
      availablePlans,
      entitlements: elevatedEntitlements.features,
      featureHighlights,
      upgradeOptions: {
        canUpgrade: recommendedCheckoutPlan !== null,
        canManageBilling: Boolean(subscription.stripeCustomerId),
        recommendedPlan: recommendedCheckoutPlan,
      },
      notes: {
        isWebhookSyncPending: billingSyncPending,
      },
      portalAvailable: Boolean(subscription.stripeCustomerId),
      manualAccess: access.manualAccessPlan
        ? {
            plan: access.manualAccessPlan,
            startsAt: access.manualAccessStartsAt?.toISOString() ?? null,
            expiresAt: access.manualAccessExpiresAt?.toISOString() ?? null,
            reason: access.manualAccessReason,
            isActive: access.isManualGrantActive,
            accessSource: access.accessSource,
          }
        : null,
      manualAccessExpiringInDays,
      isPaymentPastDue,
    });
  }

  async createCheckoutSession(artistId: string, dto: CreateCheckoutSessionDto, user: User) {
    if (!PAID_BILLING_PLANS.includes(dto.plan)) {
      throw new BadRequestException('Checkout is only available for paid plans');
    }

    const returnUrl = this.validateReturnUrl(dto.returnUrl);
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

    this.assertCheckoutTargetIsValid(artist.subscription, dto.plan);

    const stripe = this.getStripeClientOrThrow();
    const priceId = getStripePriceIdForPlan(dto.plan, this.getPriceConfig());

    if (!priceId) {
      throw new ServiceUnavailableException(`Stripe price not configured for plan "${dto.plan}"`);
    }

    if (this.shouldUpgradeExistingPaidSubscription(artist.subscription, dto.plan)) {
      const upgradedSubscription = await this.upgradeExistingStripeSubscription(
        artistId,
        artist.subscription,
        dto.plan,
      );

      await this.persistStripeSubscription(artistId, dto.plan, upgradedSubscription);

      const upgradedReturnUrl = new URL(returnUrl);
      upgradedReturnUrl.searchParams.set('refresh', 'done');
      return ok({ url: upgradedReturnUrl.toString() });
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

    let session: Awaited<ReturnType<typeof stripe.billingPortal.sessions.create>>;
    try {
      session = await stripe.billingPortal.sessions.create({
        customer: subscription.stripeCustomerId,
        return_url: returnUrl,
      });
    } catch (err) {
      // Stripe returns a StripeInvalidRequestError with code 'resource_missing'
      // when the customer ID stored in our DB no longer exists in Stripe — most
      // commonly because the app was running in test mode, the customer was
      // deleted from the Stripe dashboard, or the Stripe account was changed.
      // We clear the stale ID so the next checkout flow can create a fresh
      // customer, then surface a user-friendly error instead of a 500.
      const stripeErr = err as { type?: string; code?: string; message?: string };
      if (stripeErr.type === 'StripeInvalidRequestError' && stripeErr.code === 'resource_missing') {
        this.logger.warn(
          `[billing] Stale stripeCustomerId detected for artist ${artistId} — clearing. ` +
            `Stripe message: ${stripeErr.message ?? 'unknown'}`,
        );
        await this.prisma.subscription.update({
          where: { artistId },
          data: { stripeCustomerId: null },
        });
        throw new BadRequestException(
          'Your billing profile needs to be re-created. Please start a new subscription.',
        );
      }
      throw err;
    }

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
      event = stripe.webhooks.constructEvent(
        req.rawBody,
        signature,
        webhookSecret,
        STRIPE_WEBHOOK_TOLERANCE_SECONDS,
      );
    } catch {
      this.logger.warn('Stripe webhook verification failed');
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
      case 'invoice.payment_failed':
        await this.handlePaymentFailedEvent(
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
      this.configService.get<string>('app.appEnv') ??
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
    const now = Date.now();
    if (
      BillingService.productsCatalogCache &&
      BillingService.productsCatalogCache.expiresAt > now
    ) {
      return BillingService.productsCatalogCache.value;
    }

    // Build the four plan items (free + 2 paid Stripe-backed + enterprise
    // stub). The paid items hit the Stripe API for product/price metadata.
    // Stagelink prices change rarely, so a short in-process memoization
    // collapses the per-request Stripe calls without making the dashboard
    // visibly stale.
    const fresh = await Promise.all([
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

    BillingService.productsCatalogCache = {
      value: fresh,
      expiresAt: now + BillingService.PRODUCTS_CATALOG_TTL_MS,
    };
    return fresh;
  }

  private buildPlanSummaries(
    products: BillingPlanCatalogItem[],
    subscription: PrismaSubscription,
    recommendedCheckoutPlan: PlanTier | null,
  ): BillingPlanSummary[] {
    return products.map((product) => ({
      planCode: product.plan,
      displayName: product.productName,
      interval: product.interval,
      priceDisplay: this.formatPriceDisplay(product.amount, product.currency, product.contactSales),
      available: product.available,
      recommended: product.plan === recommendedCheckoutPlan,
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

  private resolveCheckoutBasePlan(subscription: PrismaSubscription | null): PlanTier {
    if (!subscription) return PlanTier.free;

    if (
      subscription.status === SubscriptionStatus.active ||
      subscription.status === SubscriptionStatus.trialing ||
      subscription.status === SubscriptionStatus.past_due ||
      subscription.status === SubscriptionStatus.unpaid ||
      subscription.status === SubscriptionStatus.incomplete
    ) {
      return subscription.plan;
    }

    return PlanTier.free;
  }

  private resolveRecommendedCheckoutPlan(
    products: BillingPlanCatalogItem[],
    checkoutBasePlan: PlanTier,
    isPaymentPastDue: boolean,
  ): PlanTier | null {
    if (isPaymentPastDue) return null;

    const next = products.find(
      (product): product is BillingPlanCatalogItem & { plan: PlanTier } =>
        product.plan !== 'enterprise' &&
        product.plan !== PlanTier.free &&
        product.available &&
        this.planRank(product.plan) > this.planRank(checkoutBasePlan),
    );

    return next?.plan ?? null;
  }

  private assertCheckoutTargetIsValid(
    subscription: PrismaSubscription | null,
    targetPlan: PlanTier,
  ) {
    if (
      subscription?.status === SubscriptionStatus.past_due ||
      subscription?.status === SubscriptionStatus.unpaid
    ) {
      throw new BadRequestException(
        'Resolve the existing payment issue in the billing portal before changing plans',
      );
    }

    const checkoutBasePlan = this.resolveCheckoutBasePlan(subscription);
    if (this.planRank(targetPlan) <= this.planRank(checkoutBasePlan)) {
      throw new BadRequestException('Checkout is only available for plan upgrades');
    }
  }

  private async ensureSubscriptionRecord(artistId: string): Promise<PrismaSubscription> {
    // Fast path — happens on every call once the row exists. A plain
    // `findUnique` is read-only, so it doesn't write to WAL like an
    // `upsert` with empty `update: {}` did (Postgres treats an empty
    // update as a no-op row write).
    const existing = await this.prisma.subscription.findUnique({ where: { artistId } });
    if (existing) return existing;

    // Cold path — first time, or row was deleted. `upsert` here handles
    // the race between two concurrent first-time requests cleanly.
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

  private async handlePaymentFailedEvent(
    stripeEventId: string,
    stripeEventType: string,
    stripeEventAt: Date,
    invoice: Stripe.Invoice,
  ) {
    // Sync the subscription state so that status reflects `past_due` (set by Stripe).
    await this.handleInvoiceBackedEvent(stripeEventId, stripeEventType, stripeEventAt, invoice);

    // Fire-and-forget payment failure email. Resolve artist email from the DB.
    void (async () => {
      try {
        const invoiceWithSubscription = invoice as Stripe.Invoice & {
          subscription?: string | Stripe.Subscription | null;
        };
        const subscriptionId =
          typeof invoiceWithSubscription.subscription === 'string'
            ? invoiceWithSubscription.subscription
            : invoiceWithSubscription.subscription?.id;

        if (!subscriptionId) {
          this.logger.warn(
            `invoice.payment_failed ${invoice.id}: no subscription id — skipping email`,
          );
          return;
        }

        const sub = await this.prisma.subscription.findFirst({
          where: { stripeSubscriptionId: subscriptionId },
          select: {
            plan: true,
            artist: {
              select: {
                contactEmail: true,
                user: { select: { email: true } },
              },
            },
          },
        });

        const artistEmail = sub?.artist?.contactEmail ?? sub?.artist?.user?.email ?? null;

        if (!artistEmail) {
          this.logger.warn(
            `invoice.payment_failed ${invoice.id}: could not resolve artist email — skipping email`,
          );
          return;
        }

        await this.emailService.sendPaymentFailed(artistEmail, sub?.plan ?? 'pro');
      } catch (err) {
        this.logger.error(
          `invoice.payment_failed ${invoice.id}: error sending payment failure email`,
          err,
        );
      }
    })();
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

  private shouldUpgradeExistingPaidSubscription(
    subscription: PrismaSubscription | null,
    targetPlan: PlanTier,
  ): subscription is PrismaSubscription {
    if (!subscription) {
      return false;
    }

    if (!PAID_BILLING_PLANS.includes(subscription.plan)) {
      return false;
    }

    if (
      subscription.status !== SubscriptionStatus.active &&
      subscription.status !== SubscriptionStatus.trialing
    ) {
      return false;
    }

    if (!subscription.stripeSubscriptionId) {
      return false;
    }

    return this.planRank(targetPlan) > this.planRank(subscription.plan);
  }

  private async upgradeExistingStripeSubscription(
    artistId: string,
    subscription: PrismaSubscription,
    targetPlan: PlanTier,
  ): Promise<Stripe.Subscription> {
    const stripe = this.getStripeClientOrThrow();
    const stripeSubscription = await stripe.subscriptions.retrieve(
      subscription.stripeSubscriptionId!,
    );
    const subscriptionItem = stripeSubscription.items.data[0];
    const targetPriceId = getStripePriceIdForPlan(targetPlan, this.getPriceConfig());

    if (!subscriptionItem?.id) {
      throw new ServiceUnavailableException(
        `Stripe subscription item is missing for artist ${artistId}`,
      );
    }

    if (!targetPriceId) {
      throw new ServiceUnavailableException(`Stripe price not configured for plan "${targetPlan}"`);
    }

    return stripe.subscriptions.update(stripeSubscription.id, {
      items: [
        {
          id: subscriptionItem.id,
          price: targetPriceId,
        },
      ],
      billing_cycle_anchor: 'unchanged',
      cancel_at_period_end: false,
      metadata: {
        ...stripeSubscription.metadata,
        artistId,
        plan: targetPlan,
        environment: this.getBillingEnvironment(),
      },
      proration_behavior: 'always_invoice',
    });
  }

  private async persistStripeSubscription(
    artistId: string,
    fallbackPlan: PlanTier,
    stripeSubscription: Stripe.Subscription,
  ) {
    const plan =
      this.resolvePlan(
        stripeSubscription.metadata?.plan,
        stripeSubscription.items.data[0]?.price?.id ?? null,
      ) ?? fallbackPlan;

    const write = this.buildStripeSubscriptionWrite(artistId, plan, stripeSubscription);

    return this.prisma.subscription.upsert({
      where: { artistId },
      update: write.update,
      create: write.create,
    });
  }

  private async reconcileSubscriptionFromStripe(
    artistId: string,
    subscription: PrismaSubscription,
  ): Promise<PrismaSubscription> {
    const stripe = this.getStripeClientOrThrow();

    let stripeSubscription: Stripe.Subscription | null = null;

    if (subscription.stripeCustomerId) {
      const subscriptions = await stripe.subscriptions.list({
        customer: subscription.stripeCustomerId,
        status: 'all',
        limit: 10,
      });

      stripeSubscription = this.selectMostRelevantStripeSubscription(subscriptions?.data ?? []);
    }

    if (!stripeSubscription && subscription.stripeSubscriptionId) {
      stripeSubscription = await stripe.subscriptions.retrieve(subscription.stripeSubscriptionId);
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
    const hasScheduledCancellation = Boolean(
      subscription.cancel_at_period_end || subscription.cancel_at,
    );

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
        cancelAtPeriodEnd: hasScheduledCancellation,
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
        cancelAtPeriodEnd: hasScheduledCancellation,
        currentPeriodEnd: normalizeStripeTimestamp(item?.current_period_end ?? null),
        lastStripeEventAt: stripeEventAt,
      },
    };
  }

  private selectMostRelevantStripeSubscription(
    subscriptions: Stripe.Subscription[],
  ): Stripe.Subscription | null {
    if (subscriptions.length === 0) {
      return null;
    }

    const statusPriority: Record<Stripe.Subscription.Status, number> = {
      active: 0,
      trialing: 1,
      past_due: 2,
      unpaid: 3,
      incomplete: 4,
      paused: 5,
      canceled: 6,
      incomplete_expired: 7,
    };

    return (
      [...subscriptions].sort((left, right) => {
        const priorityDelta = statusPriority[left.status] - statusPriority[right.status];
        if (priorityDelta !== 0) {
          return priorityDelta;
        }

        const leftTimestamp = left.created ?? 0;
        const rightTimestamp = right.created ?? 0;
        return rightTimestamp - leftTimestamp;
      })[0] ?? null
    );
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
