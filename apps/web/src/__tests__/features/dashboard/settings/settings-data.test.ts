import { describe, expect, it } from 'vitest';
import {
  buildUsage,
  resolvePlanLabel,
  resolveTabId,
  SETTINGS_TAB_IDS,
} from '@/features/dashboard/settings/settings-types';

describe('resolveTabId', () => {
  it('falls back to "plan" when the query param is missing', () => {
    expect(resolveTabId(undefined)).toBe('plan');
  });

  it('falls back to "plan" when the query param is unknown', () => {
    expect(resolveTabId('analytics')).toBe('plan');
  });

  it('accepts every declared tab id', () => {
    for (const id of SETTINGS_TAB_IDS) {
      expect(resolveTabId(id)).toBe(id);
    }
  });

  it('takes the first entry when given an array (Next.js behaviour for repeated params)', () => {
    expect(resolveTabId(['connections', 'plan'])).toBe('connections');
  });
});

describe('resolvePlanLabel', () => {
  it('maps plan codes to their display labels', () => {
    expect(resolvePlanLabel('free')).toBe('Free');
    expect(resolvePlanLabel('pro')).toBe('Pro');
    expect(resolvePlanLabel('pro_plus')).toBe('Pro+');
  });
});

describe('buildUsage', () => {
  const find = (usage: ReturnType<typeof buildUsage>, key: 'languages' | 'photos') =>
    usage.rows.find((r) => r.key === key);

  it('counts real photos from galleryImageUrls', () => {
    const usage = buildUsage('pro_plus', {
      baseLocale: 'en',
      galleryImageUrls: ['a.jpg', 'b.jpg', 'c.jpg'],
      translations: null,
    });
    expect(find(usage, 'photos')?.value).toBe(3);
  });

  it('counts distinct languages from baseLocale + translation locales', () => {
    const usage = buildUsage('pro_plus', {
      baseLocale: 'en',
      galleryImageUrls: [],
      translations: { bio: { en: 'hi', es: 'hola' }, displayName: { es: 'Nombre' } },
    });
    // en (base) + es (from translations) = 2
    expect(find(usage, 'languages')?.value).toBe(2);
  });

  it('languages max is 1 below Pro+ and unlimited on Pro+', () => {
    const free = buildUsage('free', { baseLocale: 'en', galleryImageUrls: [], translations: null });
    const proPlus = buildUsage('pro_plus', {
      baseLocale: 'en',
      galleryImageUrls: [],
      translations: null,
    });
    expect(find(free, 'languages')?.max).toBe(1);
    expect(find(proPlus, 'languages')?.max).toBeNull();
  });

  it('defaults to at least 1 language and 0 photos when artist is null', () => {
    const usage = buildUsage('free', null);
    expect(find(usage, 'languages')?.value).toBe(1);
    expect(find(usage, 'photos')?.value).toBe(0);
  });
});
