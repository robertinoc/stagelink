import { describe, expect, it } from 'vitest';
import { sanitizeAuthReturnTo } from '@/lib/auth-return-to';

describe('sanitizeAuthReturnTo', () => {
  it('allows internal relative paths', () => {
    expect(sanitizeAuthReturnTo('/en/dashboard')).toBe('/en/dashboard');
    expect(sanitizeAuthReturnTo('/es/dashboard?tab=profile#top')).toBe(
      '/es/dashboard?tab=profile#top',
    );
  });

  it('rejects absolute and protocol-relative URLs', () => {
    expect(sanitizeAuthReturnTo('https://evil.example/phish')).toBeUndefined();
    expect(sanitizeAuthReturnTo('//evil.example/phish')).toBeUndefined();
  });

  it('rejects malformed or ambiguous redirect values', () => {
    expect(sanitizeAuthReturnTo('')).toBeUndefined();
    expect(sanitizeAuthReturnTo('dashboard')).toBeUndefined();
    expect(sanitizeAuthReturnTo('/\\evil.example')).toBeUndefined();
  });
});
