import {
  resolveEffectiveAccess,
  type BillingSubscriptionSnapshot,
  type EffectiveAccessResult,
  type ManualAccessSnapshot,
  type PlanCode,
} from '@stagelink/types';
import type { BillingSummaryResponse } from '@/lib/api/billing';

/**
 * Client-side access resolver.
 *
 * The NestJS API already folds an active manual admin grant into
 * `summary.effectivePlan` + `summary.entitlements`, so feature gating that
 * reads those fields works automatically. This helper exists to surface the
 * *reason* (commercial vs admin grant) and the manual-grant metadata so the
 * dashboard can show an "access granted by StageLink" notice.
 */
export function resolveAccessFromSummary(
  summary: Pick<
    BillingSummaryResponse,
    'billingPlan' | 'subscriptionStatus' | 'currentPeriodEnd' | 'cancelAtPeriodEnd' | 'manualAccess'
  >,
  now: Date = new Date(),
): EffectiveAccessResult {
  const snapshot: BillingSubscriptionSnapshot = {
    plan: summary.billingPlan,
    status: summary.subscriptionStatus,
    cancelAtPeriodEnd: summary.cancelAtPeriodEnd,
    currentPeriodEnd: summary.currentPeriodEnd ? new Date(summary.currentPeriodEnd) : null,
  };

  const manual: ManualAccessSnapshot | null = summary.manualAccess
    ? {
        manualAccessPlan: summary.manualAccess.plan,
        manualAccessStartsAt: summary.manualAccess.startsAt
          ? new Date(summary.manualAccess.startsAt)
          : null,
        manualAccessExpiresAt: summary.manualAccess.expiresAt
          ? new Date(summary.manualAccess.expiresAt)
          : null,
        manualAccessReason: summary.manualAccess.reason,
        manualAccessGrantedBy: null,
      }
    : null;

  return resolveEffectiveAccess(snapshot, manual, now);
}

/** True when the tenant's current access is the result of an admin grant. */
export function isManualAccess(access: EffectiveAccessResult): boolean {
  return access.accessSource === 'manual_admin_grant' && access.isManualGrantActive;
}

/** Human label for a plan code. */
export function planLabel(plan: PlanCode): string {
  switch (plan) {
    case 'pro_plus':
      return 'PRO+';
    case 'pro':
      return 'PRO';
    default:
      return 'Free';
  }
}
