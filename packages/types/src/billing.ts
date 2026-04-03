export const PLAN_CODES = ['free', 'pro', 'pro_plus'] as const;
export type PlanCode = (typeof PLAN_CODES)[number];

export const BILLING_SUBSCRIPTION_STATUSES = [
  'inactive',
  'active',
  'canceled',
  'past_due',
  'trialing',
  'incomplete',
] as const;
export type BillingSubscriptionStatus = (typeof BILLING_SUBSCRIPTION_STATUSES)[number];

export const FEATURE_KEYS = [
  'remove_stagelink_branding',
  'custom_domain',
  'shopify_integration',
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
  'past_due',
  'canceling',
  'canceled',
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
  billingState: BillingUiState;
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

export function resolveEffectivePlan(
  snapshot: BillingSubscriptionSnapshot | null | undefined,
): PlanCode {
  if (!snapshot) return 'free';
  if (!isPaidPlan(snapshot.plan)) return 'free';
  if (!PAID_STATUSES.includes(snapshot.status)) return 'free';
  return snapshot.plan;
}

export function resolveBillingUiState(
  snapshot: BillingSubscriptionSnapshot | null | undefined,
): BillingUiState {
  if (!snapshot || snapshot.plan === 'free') return 'free';
  if (
    snapshot.cancelAtPeriodEnd &&
    (snapshot.status === 'active' || snapshot.status === 'trialing')
  ) {
    return 'canceling';
  }
  if (snapshot.status === 'active') return 'active';
  if (snapshot.status === 'trialing') return 'trialing';
  if (snapshot.status === 'past_due') return 'past_due';
  if (snapshot.status === 'canceled') return 'canceled';
  return 'syncing';
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
