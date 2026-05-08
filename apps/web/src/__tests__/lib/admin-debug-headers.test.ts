import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  collectAdminDebugHeaders,
  isAdminDebugHeadersEnabled,
  redactAdminDebugHeader,
} from '@/lib/admin-debug-headers';

describe('admin debug headers', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('is disabled unless explicitly enabled', () => {
    vi.stubEnv('BEHIND_DEBUG_HEADERS_ENABLED', '');
    expect(isAdminDebugHeadersEnabled()).toBe(false);

    vi.stubEnv('BEHIND_DEBUG_HEADERS_ENABLED', 'true');
    expect(isAdminDebugHeadersEnabled()).toBe(true);
  });

  it('redacts sensitive header names', () => {
    expect(redactAdminDebugHeader('authorization', 'Bearer token')).toBe('[redacted]');
    expect(redactAdminDebugHeader('cookie', 'session=value')).toBe('[redacted]');
    expect(redactAdminDebugHeader('x-vercel-protection-bypass', 'secret')).toBe('[redacted]');
    expect(redactAdminDebugHeader('x-api-key', 'key')).toBe('[redacted]');
    expect(redactAdminDebugHeader('x-signature', 'signature')).toBe('[redacted]');
  });

  it('keeps non-sensitive diagnostics visible', () => {
    expect(redactAdminDebugHeader('host', 'behind.stagelink.art')).toBe('behind.stagelink.art');
    expect(redactAdminDebugHeader('x-forwarded-host', 'behind.stagelink.art')).toBe(
      'behind.stagelink.art',
    );
  });

  it('collects headers with sensitive values redacted', () => {
    const headers = new Headers({
      authorization: 'Bearer token',
      host: 'behind.stagelink.art',
      cookie: 'session=value',
    });

    expect(collectAdminDebugHeaders(headers)).toEqual({
      authorization: '[redacted]',
      cookie: '[redacted]',
      host: 'behind.stagelink.art',
    });
  });
});
