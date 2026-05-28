import { describe, expect, it } from 'vitest';
import {
  buildLocalizedAlternates,
  getAlternateOpenGraphLocales,
  getOpenGraphLocale,
} from '@/lib/seo-localization';

describe('seo-localization', () => {
  it('builds locale alternates with an x-default fallback', () => {
    expect(buildLocalizedAlternates('/pricing')).toEqual({
      en: '/en/pricing',
      es: '/es/pricing',
      'x-default': '/en/pricing',
    });
  });

  it('builds absolute locale alternates when an origin is provided', () => {
    expect(buildLocalizedAlternates('/artist', 'https://stagelink.art/')).toEqual({
      en: 'https://stagelink.art/en/artist',
      es: 'https://stagelink.art/es/artist',
      'x-default': 'https://stagelink.art/en/artist',
    });
  });

  it('maps app locales to Open Graph locale tags', () => {
    expect(getOpenGraphLocale('en')).toBe('en_US');
    expect(getOpenGraphLocale('es')).toBe('es_AR');
    expect(getAlternateOpenGraphLocales('es')).toEqual(['en_US']);
  });
});
