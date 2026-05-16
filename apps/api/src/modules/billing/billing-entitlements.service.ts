import { Injectable } from '@nestjs/common';
import type { Subscription } from '@prisma/client';
import {
  buildTenantEntitlements,
  getMinimumPlanForFeature,
  hasFeature,
  resolveEffectiveAccess,
  type FeatureKey,
  type PlanCode,
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
        currentPeriodEnd: true,
        manualAccessPlan: true,
        manualAccessStartsAt: true,
        manualAccessExpiresAt: true,
        manualAccessReason: true,
        manualAccessGrantedBy: true,
      },
    });

    const snapshot = this.mapSubscriptionSnapshot(subscription);

    // Fold any active manual admin grant into the effective plan. A grant
    // only ever RAISES access (never lowers it) and never touches the
    // commercial billingPlan / subscriptionStatus surfaced to the UI.
    const access = resolveEffectiveAccess(
      snapshot,
      subscription
        ? {
            manualAccessPlan: (subscription.manualAccessPlan as PlanCode | null) ?? null,
            manualAccessStartsAt: subscription.manualAccessStartsAt,
            manualAccessExpiresAt: subscription.manualAccessExpiresAt,
            manualAccessReason: subscription.manualAccessReason,
            manualAccessGrantedBy: subscription.manualAccessGrantedBy,
          }
        : null,
    );

    const baseEntitlements = buildTenantEntitlements(snapshot);

    if (access.effectiveAccess === baseEntitlements.effectivePlan) {
      return baseEntitlements;
    }

    // Recompute features at the (higher) granted plan while preserving the
    // real commercial billingPlan / status for accurate billing display.
    const elevated = buildTenantEntitlements({
      plan: access.effectiveAccess,
      status: 'active',
      cancelAtPeriodEnd: false,
      currentPeriodEnd: null,
    });

    return {
      ...elevated,
      billingPlan: baseEntitlements.billingPlan,
      subscriptionStatus: baseEntitlements.subscriptionStatus,
      cancelAtPeriodEnd: baseEntitlements.cancelAtPeriodEnd,
    };
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
    subscription: Pick<
      Subscription,
      'plan' | 'status' | 'cancelAtPeriodEnd' | 'currentPeriodEnd'
    > | null,
  ) {
    if (!subscription) return null;

    return {
      plan: subscription.plan,
      status: subscription.status,
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
      currentPeriodEnd: subscription.currentPeriodEnd,
    };
  }
}
