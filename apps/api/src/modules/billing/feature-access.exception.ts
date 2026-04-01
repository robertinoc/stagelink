import { ForbiddenException, HttpStatus } from '@nestjs/common';
import type { FeatureKey, PlanCode } from '@stagelink/types';

export class FeatureAccessException extends ForbiddenException {
  constructor(feature: FeatureKey, currentPlan: PlanCode, requiredPlan: PlanCode) {
    super({
      statusCode: HttpStatus.FORBIDDEN,
      error: 'Forbidden',
      message: 'Feature not included in current plan',
      code: 'FEATURE_NOT_INCLUDED_IN_PLAN',
      feature,
      currentPlan,
      requiredPlan,
    });
  }
}
