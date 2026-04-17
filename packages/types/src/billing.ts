export const PLAN_CODES = ['free', 'pro', 'pro_plus'] as const;
export type PlanCode = (typeof PLAN_CODES)[number];

export const BILLING_SUBSCRIPTION_STATUSES = [
  'inactive',
  'active',
  'canceled',
  'past_due',
  'unpaid',
  'trialing',
  'incomplete',
  'incomplete_expired',
] as const;
export type BillingSubscriptionStatus = (typeof BILLING_SUBSCRIPTION_STATUSES)[number];

export const FEATURE_KEYS = [
  'remove_stagelink_branding',
  'custom_domain',
  'shopify_integration',
  'smart_merch',
  'epk_builder',
  'analytics_pro',
  'multi_language_pages',
  'advanced_fan_insights',
] as const;
export type FeatureKey = (typeof FEATURE_KEYS)[number];

export const BILLING_UI_STATES = [
  'free',
  'active',
  'trialing',
  'payment_issue',
  'canceling',
  'canceled',
  'pending_checkout',
  'syncing',
] as const;
export type BillingUiState = (typeof BILLING_UI_STATES)[number];
const PLAN_ORDER: PlanCode[] = ['free', 'pro', 'pro_plus'];

export const PLAN_FEATURE_MATRIX: Record<PlanCode, readonly FeatureKey[]> = {
  free: [],
  pro: ['remove_stagelink_branding', 'custom_domain', 'epk_builder'],
  pro_plus: [
    'remove_stagelink_branding',
    'custom_domain',
    'epk_builder',
    'analytics_pro',
    'multi_language_pages',
    'advanced_fan_insights',
    'shopify_integration',
    'smart_merch',
  ],
};

function buildFeatureMinimumPlan(): Record<FeatureKey, PlanCode> {
  return FEATURE_KEYS.reduce<Record<FeatureKey, PlanCode>>(
    (acc, feature) => {
      acc[feature] =
        PLAN_ORDER.find((plan) => PLAN_FEATURE_MATRIX[plan].includes(feature)) ?? 'free';
      return acc;
    },
    {} as Record<FeatureKey, PlanCode>,
  );
}

export const FEATURE_MINIMUM_PLAN: Record<FeatureKey, PlanCode> = buildFeatureMinimumPlan();

export interface BillingSubscriptionSnapshot {
  plan: PlanCode;
  status: BillingSubscriptionStatus;
  cancelAtPeriodEnd?: boolean | null;
  currentPeriodEnd?: Date | null;
}

export const BILLING_MESSAGE_CODES = [
  'CHECKOUT_PENDING_CONFIRMATION',
  'CANCELS_AT_PERIOD_END',
  'ACCESS_UNTIL_PERIOD_END',
  'PAYMENT_ISSUE_ACCESS_RETAINED',
  'PAYMENT_ISSUE_ACCESS_REVOKED',
  'SUBSCRIPTION_CANCELED',
  'NO_ACTIVE_SUBSCRIPTION',
] as const;
export type BillingMessageCode = (typeof BILLING_MESSAGE_CODES)[number];

export interface BillingMessage {
  type: 'info' | 'warning' | 'error';
  code: BillingMessageCode;
}

export interface TenantEntitlements {
  effectivePlan: PlanCode;
  billingPlan: PlanCode;
  subscriptionStatus: BillingSubscriptionStatus;
  cancelAtPeriodEnd: boolean;
  features: Record<FeatureKey, boolean>;
  featureKeys: FeatureKey[];
}

export interface BillingFeatureSummary {
  feature: FeatureKey;
  included: boolean;
  requiredPlan: PlanCode;
}

export interface BillingPlanSummary {
  planCode: PlanCode | 'enterprise';
  displayName: string;
  interval: string | null;
  priceDisplay: string;
  available: boolean;
  recommended: boolean;
  contactSales: boolean;
  isCurrent: boolean;
  features: FeatureKey[];
}

export interface BillingUpgradeOptions {
  canUpgrade: boolean;
  canManageBilling: boolean;
  recommendedPlan: PlanCode | null;
}

export interface BillingUiSummary {
  artistId: string;
  effectivePlan: PlanCode;
  billingPlan: PlanCode;
  subscriptionStatus: BillingSubscriptionStatus;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  effectiveBillingState: BillingUiState;
  billingState: BillingUiState;
  billingSyncPending: boolean;
  billingMessages: BillingMessage[];
  availablePlans: BillingPlanSummary[];
  entitlements: Record<FeatureKey, boolean>;
  featureHighlights: BillingFeatureSummary[];
  upgradeOptions: BillingUpgradeOptions;
  notes: {
    isWebhookSyncPending: boolean;
  };
  portalAvailable: boolean;
}
const PAID_STATUSES: BillingSubscriptionStatus[] = ['active', 'trialing'];

export function isPaidPlan(plan: PlanCode): boolean {
  return plan !== 'free';
}

export function hasFeature(plan: PlanCode, feature: FeatureKey): boolean {
  return PLAN_FEATURE_MATRIX[plan].includes(feature);
}

export function getPlanFeatures(plan: PlanCode): FeatureKey[] {
  return [...PLAN_FEATURE_MATRIX[plan]];
}

export function getFeatureAvailability(plan: PlanCode): Record<FeatureKey, boolean> {
  return FEATURE_KEYS.reduce<Record<FeatureKey, boolean>>(
    (acc, feature) => {
      acc[feature] = hasFeature(plan, feature);
      return acc;
    },
    {} as Record<FeatureKey, boolean>,
  );
}

export function getMinimumPlanForFeature(feature: FeatureKey): PlanCode {
  return FEATURE_MINIMUM_PLAN[feature];
}

export function getPlanRank(plan: PlanCode): number {
  return PLAN_ORDER.indexOf(plan);
}

export function getUpgradePlanForFeature(
  currentPlan: PlanCode,
  feature: FeatureKey,
): PlanCode | null {
  const requiredPlan = getMinimumPlanForFeature(feature);
  return getPlanRank(requiredPlan) > getPlanRank(currentPlan) ? requiredPlan : null;
}

function isFutureDate(date: Date | null | undefined, now: Date): boolean {
  return Boolean(date && date.getTime() > now.getTime());
}

export function subscriptionGrantsAccess(
  snapshot: BillingSubscriptionSnapshot | null | undefined,
  now: Date = new Date(),
): boolean {
  if (!snapshot) return false;
  if (!isPaidPlan(snapshot.plan)) return false;

  if (PAID_STATUSES.includes(snapshot.status)) return true;

  if (snapshot.status === 'past_due' && isFutureDate(snapshot.currentPeriodEnd, now)) {
    return true;
  }

  return false;
}

export function isBillingSyncPending(
  snapshot: BillingSubscriptionSnapshot | null | undefined,
): boolean {
  if (!snapshot) return false;
  if (!isPaidPlan(snapshot.plan)) return false;
  return snapshot.status === 'inactive' || snapshot.status === 'incomplete';
}

export function resolveEffectivePlan(
  snapshot: BillingSubscriptionSnapshot | null | undefined,
  now: Date = new Date(),
): PlanCode {
  if (!snapshot) return 'free';
  return subscriptionGrantsAccess(snapshot, now) ? snapshot.plan : 'free';
}

export function resolveBillingUiState(
  snapshot: BillingSubscriptionSnapshot | null | undefined,
  now: Date = new Date(),
): BillingUiState {
  if (!snapshot || snapshot.plan === 'free') return 'free';

  if (snapshot.status === 'inactive') return 'syncing';
  if (snapshot.status === 'incomplete') return 'pending_checkout';
  if (snapshot.status === 'incomplete_expired') return 'payment_issue';
  if (snapshot.status === 'unpaid' || snapshot.status === 'past_due') return 'payment_issue';

  if (snapshot.status === 'active' || snapshot.status === 'trialing') {
    if (snapshot.cancelAtPeriodEnd) {
      return 'canceling';
    }

    return snapshot.status;
  }

  if (snapshot.status === 'canceled') return 'canceled';

  return 'syncing';
}

export function buildBillingMessages(
  snapshot: BillingSubscriptionSnapshot | null | undefined,
  now: Date = new Date(),
): BillingMessage[] {
  if (!snapshot || !isPaidPlan(snapshot.plan)) {
    return [{ type: 'info', code: 'NO_ACTIVE_SUBSCRIPTION' }];
  }

  const messages: BillingMessage[] = [];
  const accessGranted = subscriptionGrantsAccess(snapshot, now);

  if (snapshot.status === 'inactive' || snapshot.status === 'incomplete') {
    messages.push({ type: 'warning', code: 'CHECKOUT_PENDING_CONFIRMATION' });
  }

  if (
    snapshot.cancelAtPeriodEnd &&
    (snapshot.status === 'active' || snapshot.status === 'trialing')
  ) {
    messages.push({ type: 'info', code: 'CANCELS_AT_PERIOD_END' });
  }

  if (snapshot.status === 'canceled') {
    messages.push({ type: 'info', code: 'SUBSCRIPTION_CANCELED' });
  }

  if (snapshot.status === 'past_due' || snapshot.status === 'unpaid') {
    messages.push({
      type: accessGranted ? 'warning' : 'error',
      code: accessGranted ? 'PAYMENT_ISSUE_ACCESS_RETAINED' : 'PAYMENT_ISSUE_ACCESS_REVOKED',
    });
  }

  if (messages.length === 0 && !accessGranted) {
    messages.push({ type: 'info', code: 'NO_ACTIVE_SUBSCRIPTION' });
  }

  return messages;
}

export function buildTenantEntitlements(
  snapshot: BillingSubscriptionSnapshot | null | undefined,
): TenantEntitlements {
  const effectivePlan = resolveEffectivePlan(snapshot);

  return {
    effectivePlan,
    billingPlan: snapshot?.plan ?? 'free',
    subscriptionStatus: snapshot?.status ?? 'inactive',
    cancelAtPeriodEnd: snapshot?.cancelAtPeriodEnd ?? false,
    features: getFeatureAvailability(effectivePlan),
    featureKeys: getPlanFeatures(effectivePlan),
  };
}
