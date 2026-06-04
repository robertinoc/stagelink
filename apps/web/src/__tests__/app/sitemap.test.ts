import { afterEach, describe, expect, it, vi } from 'vitest';
import sitemap from '@/app/sitemap';

describe('sitemap', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('emits localized static entries and falls back gracefully when the API is unavailable', async () => {
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://stagelink.art');
    // API fetch fails → artist pages are skipped, static entries remain.
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network down')));

    const entries = await sitemap();
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

  it('appends localized entries for published artist pages', async () => {
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://stagelink.art');
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          items: [{ username: 'robertino', updatedAt: '2026-01-01T00:00:00.000Z' }],
          nextCursor: null,
        }),
      }),
    );

    const entries = await sitemap();
    const urls = entries.map((entry) => entry.url);

    expect(urls).toContain('https://stagelink.art/en/robertino');
    expect(urls).toContain('https://stagelink.art/es/robertino');

    const artistEntry = entries.find((e) => e.url === 'https://stagelink.art/en/robertino');
    expect(artistEntry?.alternates?.languages).toEqual({
      en: 'https://stagelink.art/en/robertino',
      es: 'https://stagelink.art/es/robertino',
      'x-default': 'https://stagelink.art/en/robertino',
    });
  });
});
