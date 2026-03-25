import { IsString, IsIn } from 'class-validator';

export const BILLING_PLANS = ['free', 'pro', 'pro_plus'] as const;
export type BillingPlan = (typeof BILLING_PLANS)[number];

/**
 * CreateCheckoutSessionDto — POST /api/billing/checkout
 * Initiates a Stripe Checkout session for plan upgrade.
 */
export class CreateCheckoutSessionDto {
  @IsString()
  artistId!: string;

  @IsIn(BILLING_PLANS)
  plan!: BillingPlan;
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
