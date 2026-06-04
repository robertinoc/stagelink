import { describe, expect, it } from 'vitest';
import { buildArtistOgImageUrl, OG_ARTIST_LIMITS } from '@/lib/og-image';

describe('buildArtistOgImageUrl', () => {
  it('builds an absolute URL with name + handle query params', () => {
    const url = buildArtistOgImageUrl('https://stagelink.art', 'Robertino', 'robertino');
    const parsed = new URL(url);

    expect(parsed.origin).toBe('https://stagelink.art');
    expect(parsed.pathname).toBe('/api/og/artist');
    expect(parsed.searchParams.get('name')).toBe('Robertino');
    expect(parsed.searchParams.get('handle')).toBe('robertino');
  });

  it('strips a trailing slash from the origin', () => {
    const url = buildArtistOgImageUrl('https://stagelink.art/', 'A', 'a');
    expect(new URL(url).origin).toBe('https://stagelink.art');
  });

  it('falls back to the canonical origin when none is provided', () => {
    const url = buildArtistOgImageUrl('', 'A', 'a');
    expect(new URL(url).origin).toBe('https://stagelink.art');
  });

  it('truncates over-long name and handle to the documented limits', () => {
    const longName = 'x'.repeat(200);
    const longHandle = 'y'.repeat(200);
    const url = buildArtistOgImageUrl('https://stagelink.art', longName, longHandle);
    const parsed = new URL(url);

    expect(parsed.searchParams.get('name')).toHaveLength(OG_ARTIST_LIMITS.name);
    expect(parsed.searchParams.get('handle')).toHaveLength(OG_ARTIST_LIMITS.handle);
  });

  it('encodes special characters safely', () => {
    const url = buildArtistOgImageUrl('https://stagelink.art', 'DJ Sol & Luna', 'sol_luna');
    const parsed = new URL(url);
    expect(parsed.searchParams.get('name')).toBe('DJ Sol & Luna');
  });
});
