import { afterEach, describe, expect, it, vi } from 'vitest';
import { getCanonicalAppUrl } from '@/lib/site-url';

describe('getCanonicalAppUrl', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('falls back to the production domain', () => {
    vi.stubEnv('NEXT_PUBLIC_APP_URL', '');
    expect(getCanonicalAppUrl()).toBe('https://stagelink.art');
  });

  it('normalizes a configured app URL', () => {
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://preview.stagelink.art/');
    expect(getCanonicalAppUrl()).toBe('https://preview.stagelink.art');
  });
});
