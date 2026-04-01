import { ForbiddenException, HttpStatus } from '@nestjs/common';
import type { BillingSubscriptionStatus, FeatureKey, PlanCode } from '@stagelink/types';

interface FeatureAccessErrorPayload {
  feature: FeatureKey;
  effectivePlan: PlanCode;
  billingPlan: PlanCode;
  subscriptionStatus: BillingSubscriptionStatus;
  requiredPlan: PlanCode;
}

export class FeatureAccessException extends ForbiddenException {
  constructor(payload: FeatureAccessErrorPayload) {
    super({
      statusCode: HttpStatus.FORBIDDEN,
      error: 'Forbidden',
      message: 'Feature not included in current plan',
      code: 'FEATURE_NOT_INCLUDED_IN_PLAN',
      ...payload,
    });
  }
}
