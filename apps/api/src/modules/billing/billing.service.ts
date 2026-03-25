import { Injectable } from '@nestjs/common';

export type PlanTier = 'free' | 'pro' | 'pro_plus';

@Injectable()
export class BillingService {
  /**
   * TODO: Query Stripe subscription by customer ID.
   * Map Stripe price ID → plan tier.
   */
  getSubscription(artistId: string) {
    return {
      data: {
        plan: 'free' as PlanTier,
        status: 'active',
        currentPeriodEnd: null,
      },
      artistId,
      message: 'Billing stub — Stripe integration pending',
    };
  }
}
