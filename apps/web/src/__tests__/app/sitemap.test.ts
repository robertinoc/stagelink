import { afterEach, describe, expect, it, vi } from 'vitest';
import sitemap from '@/app/sitemap';

describe('sitemap', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('emits localized entries for indexable static public pages', () => {
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://stagelink.art');

    const entries = sitemap();
    const urls = entries.map((entry) => entry.url);

    expect(urls).toEqual([
      'https://stagelink.art/en',
      'https://stagelink.art/es',
      'https://stagelink.art/en/pricing',
      'https://stagelink.art/es/pricing',
      'https://stagelink.art/en/install',
      'https://stagelink.art/es/install',
    ]);
    expect(entries[0]?.alternates?.languages).toEqual({
      en: 'https://stagelink.art/en',
      es: 'https://stagelink.art/es',
      'x-default': 'https://stagelink.art/en',
    });
  });
});
