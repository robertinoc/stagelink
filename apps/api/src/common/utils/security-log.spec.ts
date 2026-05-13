import { formatSecurityEvent, sanitizeLogPath, sanitizeLogValue } from './security-log';

describe('security log helpers', () => {
  it('removes query strings from paths before logging', () => {
    expect(sanitizeLogPath('/api/assets/upload-intent?token=secret&code=123')).toBe(
      '/api/assets/upload-intent',
    );
  });

  it('strips control characters from log fields', () => {
    expect(sanitizeLogValue('bad\nheader\tvalue')).toBe('bad header value');
  });

  it('formats sanitized structured security events', () => {
    const event = formatSecurityEvent('rate_limit.exceeded', {
      path: '/api/test?token=secret',
      ip: '198.51.100.1\nspoofed',
      limit: 10,
    });

    expect(event).toContain('security_event=rate_limit.exceeded');
    expect(event).toContain('"path":"/api/test"');
    expect(event).toContain('"ip":"198.51.100.1 spoofed"');
    expect(event).not.toContain('token=secret');
    expect(event).not.toContain('\n');
  });
});
