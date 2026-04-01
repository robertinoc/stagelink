import { Injectable } from '@nestjs/common';
import type { Subscription } from '@prisma/client';
import {
  buildTenantEntitlements,
  getMinimumPlanForFeature,
  hasFeature,
  type FeatureKey,
  type TenantEntitlements,
} from '@stagelink/types';
import { PrismaService } from '../../lib/prisma.service';
import { FeatureAccessException } from './feature-access.exception';

@Injectable()
export class BillingEntitlementsService {
  constructor(private readonly prisma: PrismaService) {}

  async getArtistEntitlements(artistId: string): Promise<TenantEntitlements> {
    const subscription = await this.prisma.subscription.findUnique({
      where: { artistId },
      select: {
        plan: true,
        status: true,
        cancelAtPeriodEnd: true,
      },
    });

    return buildTenantEntitlements(this.mapSubscriptionSnapshot(subscription));
  }

  async hasFeatureAccess(artistId: string, feature: FeatureKey): Promise<boolean> {
    const entitlements = await this.getArtistEntitlements(artistId);
    return hasFeature(entitlements.effectivePlan, feature);
  }

  async assertFeatureAccess(artistId: string, feature: FeatureKey): Promise<TenantEntitlements> {
    const entitlements = await this.getArtistEntitlements(artistId);

    if (!hasFeature(entitlements.effectivePlan, feature)) {
      throw new FeatureAccessException({
        feature,
        effectivePlan: entitlements.effectivePlan,
        billingPlan: entitlements.billingPlan,
        subscriptionStatus: entitlements.subscriptionStatus,
        requiredPlan: getMinimumPlanForFeature(feature),
      });
    }

    return entitlements;
  }

  private mapSubscriptionSnapshot(
    subscription: Pick<Subscription, 'plan' | 'status' | 'cancelAtPeriodEnd'> | null,
  ) {
    if (!subscription) return null;

    return {
      plan: subscription.plan,
      status: subscription.status,
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
    };
  }
}
