import { describe, expect, it } from 'vitest';
import { buildPriceMap } from '@/lib/pricing-catalog';

describe('buildPriceMap', () => {
  it('maps available plans to their price display', () => {
    const map = buildPriceMap([
      { plan: 'free', priceDisplay: '$0', available: true },
      { plan: 'pro', priceDisplay: '$19', available: true },
      { plan: 'pro_plus', priceDisplay: '$39', available: true },
    ]);

    expect(map).toEqual({ free: '$0', pro: '$19', pro_plus: '$39' });
  });

  it('skips unavailable plans so the page can fall back to static copy', () => {
    const map = buildPriceMap([
      { plan: 'pro', priceDisplay: '$19', available: false },
      { plan: 'pro_plus', priceDisplay: '$39', available: true },
    ]);

    expect(map).toEqual({ pro_plus: '$39' });
  });

  it('skips blank and "Unavailable" price displays', () => {
    const map = buildPriceMap([
      { plan: 'pro', priceDisplay: 'Unavailable', available: true },
      { plan: 'pro_plus', priceDisplay: '   ', available: true },
      { plan: 'free', priceDisplay: '$0', available: true },
    ]);

    expect(map).toEqual({ free: '$0' });
  });
});
