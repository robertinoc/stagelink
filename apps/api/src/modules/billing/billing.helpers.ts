import { PlanTier, SubscriptionStatus } from '@prisma/client';
import type Stripe from 'stripe';

export const BILLING_PLAN_ORDER: PlanTier[] = ['free', 'pro', 'pro_plus'];
export const PAID_BILLING_PLANS: PlanTier[] = ['pro', 'pro_plus'];

export interface StripePriceConfig {
  proPriceId?: string | null;
  proPlusPriceId?: string | null;
}

export function getStripePriceIdForPlan(plan: PlanTier, config: StripePriceConfig): string | null {
  switch (plan) {
    case 'pro':
      return config.proPriceId ?? null;
    case 'pro_plus':
      return config.proPlusPriceId ?? null;
    default:
      return null;
  }
}

export function getPlanFromStripePriceId(
  priceId: string | null | undefined,
  config: StripePriceConfig,
): PlanTier | null {
  if (!priceId) return null;
  if (priceId === config.proPriceId) return 'pro';
  if (priceId === config.proPlusPriceId) return 'pro_plus';
  return null;
}

export function mapStripeSubscriptionStatus(
  status: Stripe.Subscription.Status,
): SubscriptionStatus {
  switch (status) {
    case 'paused':
      return SubscriptionStatus.inactive;
    case 'active':
      return SubscriptionStatus.active;
    case 'trialing':
      return SubscriptionStatus.trialing;
    case 'past_due':
      return SubscriptionStatus.past_due;
    case 'unpaid':
      return SubscriptionStatus.unpaid;
    case 'canceled':
      return SubscriptionStatus.canceled;
    case 'incomplete':
      return SubscriptionStatus.incomplete;
    case 'incomplete_expired':
      return SubscriptionStatus.incomplete_expired;
    default:
      return SubscriptionStatus.incomplete;
  }
}

export function normalizeStripeTimestamp(timestamp?: number | null): Date | null {
  if (!timestamp || timestamp <= 0) return null;
  return new Date(timestamp * 1000);
}
