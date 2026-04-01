import { PlanTier, SubscriptionStatus } from '@prisma/client';
import {
  getPlanFromStripePriceId,
  getStripePriceIdForPlan,
  mapStripeSubscriptionStatus,
  normalizeStripeTimestamp,
} from './billing.helpers';

const PRICE_CONFIG = {
  proPriceId: 'price_pro_123',
  proPlusPriceId: 'price_pro_plus_456',
};

describe('billing.helpers', () => {
  describe('getStripePriceIdForPlan', () => {
    it('returns the configured Stripe price id for paid plans', () => {
      expect(getStripePriceIdForPlan(PlanTier.pro, PRICE_CONFIG)).toBe('price_pro_123');
      expect(getStripePriceIdForPlan(PlanTier.pro_plus, PRICE_CONFIG)).toBe('price_pro_plus_456');
    });

    it('returns null for the free plan', () => {
      expect(getStripePriceIdForPlan(PlanTier.free, PRICE_CONFIG)).toBeNull();
    });
  });

  describe('getPlanFromStripePriceId', () => {
    it('maps configured Stripe price ids back to internal plan tiers', () => {
      expect(getPlanFromStripePriceId('price_pro_123', PRICE_CONFIG)).toBe(PlanTier.pro);
      expect(getPlanFromStripePriceId('price_pro_plus_456', PRICE_CONFIG)).toBe(PlanTier.pro_plus);
    });

    it('returns null when the price id is unknown', () => {
      expect(getPlanFromStripePriceId('price_unknown', PRICE_CONFIG)).toBeNull();
      expect(getPlanFromStripePriceId(null, PRICE_CONFIG)).toBeNull();
    });
  });

  describe('mapStripeSubscriptionStatus', () => {
    it('maps active-like statuses correctly', () => {
      expect(mapStripeSubscriptionStatus('active')).toBe(SubscriptionStatus.active);
      expect(mapStripeSubscriptionStatus('trialing')).toBe(SubscriptionStatus.trialing);
    });

    it('maps delinquent statuses to past_due', () => {
      expect(mapStripeSubscriptionStatus('past_due')).toBe(SubscriptionStatus.past_due);
      expect(mapStripeSubscriptionStatus('unpaid')).toBe(SubscriptionStatus.past_due);
      expect(mapStripeSubscriptionStatus('paused')).toBe(SubscriptionStatus.past_due);
    });

    it('maps canceled/incomplete statuses safely', () => {
      expect(mapStripeSubscriptionStatus('canceled')).toBe(SubscriptionStatus.canceled);
      expect(mapStripeSubscriptionStatus('incomplete')).toBe(SubscriptionStatus.incomplete);
      expect(mapStripeSubscriptionStatus('incomplete_expired')).toBe(SubscriptionStatus.incomplete);
    });
  });

  describe('normalizeStripeTimestamp', () => {
    it('returns null for empty timestamps', () => {
      expect(normalizeStripeTimestamp(null)).toBeNull();
      expect(normalizeStripeTimestamp(undefined)).toBeNull();
      expect(normalizeStripeTimestamp(0)).toBeNull();
    });

    it('converts unix seconds into Date', () => {
      expect(normalizeStripeTimestamp(1711929600)?.toISOString()).toBe('2024-04-01T00:00:00.000Z');
    });
  });
});
