'use client';

import type { BillingSummaryResponse } from '@/lib/api/billing';

interface BillingStatusBannerProps {
  summary: BillingSummaryResponse;
  /** URL for the Stripe portal action (used by the payment past-due CTA). */
  portalActionUrl?: string;
}

function formatDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function resolvePlanLabel(plan: string): string {
  if (plan === 'pro_plus') return 'Pro+';
  if (plan === 'pro') return 'Pro';
  return plan;
}

type BannerVariant = 'red' | 'purple' | 'amber';

interface BannerConfig {
  variant: BannerVariant;
  icon: string;
  message: string;
  ctaLabel?: string;
  ctaUrl?: string;
}

const VARIANT_CLASSES: Record<
  BannerVariant,
  { border: string; bg: string; text: string; subText: string; btn: string }
> = {
  red: {
    border: 'border-l-4 border-l-red-500 border border-red-200',
    bg: 'bg-red-50',
    text: 'text-red-900',
    subText: 'text-red-700',
    btn: 'bg-red-600 text-white hover:bg-red-700',
  },
  purple: {
    border: 'border-l-4 border-l-violet-500 border border-violet-200',
    bg: 'bg-violet-50',
    text: 'text-violet-900',
    subText: 'text-violet-700',
    btn: 'bg-violet-600 text-white hover:bg-violet-700',
  },
  amber: {
    border: 'border-l-4 border-l-amber-500 border border-amber-200',
    bg: 'bg-amber-50',
    text: 'text-amber-900',
    subText: 'text-amber-700',
    btn: 'bg-amber-600 text-white hover:bg-amber-700',
  },
};

/**
 * Renders at most ONE priority-ordered billing status banner.
 *
 * Priority (highest → lowest):
 * 1. Payment past due (red)
 * 2. Manual grant active (purple)
 * 3. Manual grant expiring soon (amber)
 * 4. Cancel at period end (amber)
 * 5. No banner for healthy/free subscriptions
 */
export function BillingStatusBanner({ summary, portalActionUrl }: BillingStatusBannerProps) {
  const banner = resolveBanner(summary, portalActionUrl);
  if (!banner) return null;

  const classes = VARIANT_CLASSES[banner.variant];

  return (
    <div className={`flex items-start gap-4 rounded-lg p-4 ${classes.border} ${classes.bg}`}>
      <span className="mt-0.5 text-xl leading-none" aria-hidden="true">
        {banner.icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className={`text-sm font-medium ${classes.text}`}>{banner.message}</p>
      </div>
      {banner.ctaLabel && banner.ctaUrl ? (
        <a
          href={banner.ctaUrl}
          className={`flex-shrink-0 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${classes.btn}`}
        >
          {banner.ctaLabel}
        </a>
      ) : null}
    </div>
  );
}

function resolveBanner(
  summary: BillingSummaryResponse,
  portalActionUrl?: string,
): BannerConfig | null {
  // Priority 1: payment past due
  if (summary.isPaymentPastDue) {
    return {
      variant: 'red',
      icon: '⚠️',
      message:
        "We couldn't process your payment. Please update your billing details to avoid losing access.",
      ctaLabel: 'Manage Billing',
      ctaUrl: portalActionUrl,
    };
  }

  const manualAccess = summary.manualAccess;
  const isManualActive = manualAccess?.isActive === true;

  // Priority 2: manual grant expiring soon
  if (isManualActive && summary.manualAccessExpiringInDays != null) {
    const days = summary.manualAccessExpiringInDays;
    const planName = resolvePlanLabel(manualAccess!.plan ?? '');
    const dayWord = days === 1 ? 'day' : 'days';
    return {
      variant: 'amber',
      icon: '⏳',
      message: `Your temporary ${planName} access expires in ${days} ${dayWord}. Contact support to extend.`,
    };
  }

  // Priority 3: manual grant active (not expiring soon)
  if (isManualActive && manualAccess?.expiresAt) {
    const planName = resolvePlanLabel(manualAccess.plan ?? '');
    const expiryDate = formatDate(manualAccess.expiresAt);
    return {
      variant: 'purple',
      icon: '✨',
      message: `You have temporary ${planName} access until ${expiryDate}.`,
    };
  }

  // Priority 4: active manual grant without expiry date
  if (isManualActive && !manualAccess?.expiresAt) {
    const planName = resolvePlanLabel(manualAccess!.plan ?? '');
    return {
      variant: 'purple',
      icon: '✨',
      message: `You have temporary ${planName} access (no expiry set).`,
    };
  }

  // Priority 5: cancel at period end
  if (summary.cancelAtPeriodEnd && summary.currentPeriodEnd) {
    const planName = resolvePlanLabel(summary.billingPlan);
    const periodEndDate = formatDate(summary.currentPeriodEnd);
    return {
      variant: 'amber',
      icon: '📅',
      message: `Your ${planName} subscription is active until ${periodEndDate}, then reverts to Free.`,
    };
  }

  return null;
}
