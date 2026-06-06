import { IsIn, IsOptional, IsUrl } from 'class-validator';

export const BILLING_PLANS = ['free', 'pro', 'pro_plus'] as const;
export type BillingPlan = (typeof BILLING_PLANS)[number];

/** Paid plans a portal "switch plan" flow can target. */
export const PORTAL_TARGET_PLANS = ['pro', 'pro_plus'] as const;
export type PortalTargetPlan = (typeof PORTAL_TARGET_PLANS)[number];

/**
 * CreateCheckoutSessionDto — POST /api/billing/checkout
 * Initiates a Stripe Checkout session for plan upgrade.
 */
export class CreateCheckoutSessionDto {
  @IsIn(BILLING_PLANS)
  plan!: BillingPlan;

  @IsUrl({
    require_tld: false,
    require_protocol: true,
  })
  returnUrl!: string;
}

export class CreatePortalSessionDto {
  @IsUrl({
    require_tld: false,
    require_protocol: true,
  })
  returnUrl!: string;

  /**
   * Optional deep-link target. When set, the portal opens directly on the
   * "switch to {targetPlan}" confirmation screen (Stripe `flow_data`) instead
   * of the generic overview — used by the "Downgrade to Pro" action.
   */
  @IsOptional()
  @IsIn(PORTAL_TARGET_PLANS)
  targetPlan?: PortalTargetPlan;
}

/**
 * StripeWebhookDto — POST /api/billing/webhook
 * Raw Stripe webhook payload. Validation done via Stripe signature
 * (stripe.webhooks.constructEvent), not class-validator.
 * This DTO is a documentation marker only.
 */
export class StripeWebhookDto {
  // Validated by Stripe SDK, not by class-validator.
  // See: https://stripe.com/docs/webhooks/signatures
}
