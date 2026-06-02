import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ANALYTICS_EVENTS } from '@stagelink/types';
import { trackPlatformFunnelEvent } from '@/lib/analytics/track';
import { isAnalyticsAllowed } from '@/lib/analytics/consent';
import { getPostHog } from '@/lib/analytics/posthog';
import { trackUmamiEvent } from '@/lib/analytics/umami';

vi.mock('@/lib/analytics/consent', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/analytics/consent')>();
  return {
    ...actual,
    isAnalyticsAllowed: vi.fn(),
  };
});

vi.mock('@/lib/analytics/posthog', () => ({
  getPostHog: vi.fn(),
}));

vi.mock('@/lib/analytics/umami', () => ({
  trackUmamiEvent: vi.fn(),
}));

describe('trackPlatformFunnelEvent', () => {
  beforeEach(() => {
    vi.mocked(isAnalyticsAllowed).mockReset();
    vi.mocked(getPostHog).mockReset();
    vi.mocked(trackUmamiEvent).mockReset();
  });

  it('does not emit without analytics consent', () => {
    vi.mocked(isAnalyticsAllowed).mockReturnValue(false);

    trackPlatformFunnelEvent(ANALYTICS_EVENTS.AUTH_LOGIN_STARTED, {
      locale: 'es',
      surface: 'login',
    });

    expect(getPostHog).not.toHaveBeenCalled();
    expect(trackUmamiEvent).not.toHaveBeenCalled();
  });

  it('emits the same typed funnel event to PostHog and Umami', () => {
    const capture = vi.fn();
    vi.mocked(isAnalyticsAllowed).mockReturnValue(true);
    vi.mocked(getPostHog).mockReturnValue({ capture } as never);

    trackPlatformFunnelEvent(ANALYTICS_EVENTS.AUTH_SIGNUP_STARTED, {
      locale: 'en',
      surface: 'signup',
    });

    const expectedPayload = {
      locale: 'en',
      surface: 'signup',
      environment: 'test',
    };

    expect(capture).toHaveBeenCalledWith(ANALYTICS_EVENTS.AUTH_SIGNUP_STARTED, expectedPayload);
    expect(trackUmamiEvent).toHaveBeenCalledWith(
      ANALYTICS_EVENTS.AUTH_SIGNUP_STARTED,
      expectedPayload,
    );
  });
});
