import { formatAnalyticsEvent } from './analytics-log';

describe('formatAnalyticsEvent', () => {
  it('formats a grep-friendly analytics_ingest line with JSON metadata', () => {
    const line = formatAnalyticsEvent('failed', { eventType: 'page_view', artistId: 'artist-1' });
    expect(line).toBe('analytics_ingest=failed {"eventType":"page_view","artistId":"artist-1"}');
  });

  it('preserves numbers and booleans, stringifies everything else', () => {
    const line = formatAnalyticsEvent('failed', { count: 3, ok: false, reason: 'db down' });
    expect(line).toContain('"count":3');
    expect(line).toContain('"ok":false');
    expect(line).toContain('"reason":"db down"');
  });

  it('strips newlines/tabs to keep the event on a single log line', () => {
    const line = formatAnalyticsEvent('failed', { reason: 'line1\nline2\tend' });
    expect(line).not.toMatch(/[\r\n\t]/);
  });
});
