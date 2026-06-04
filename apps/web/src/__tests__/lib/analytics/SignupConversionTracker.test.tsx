import { act, render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ANALYTICS_EVENTS } from '@stagelink/types';
import { CONSENT_CHANGED_EVENT, isAnalyticsAllowed } from '@/lib/analytics/consent';
import {
  clearPendingSignup,
  isPendingSignupForAccount,
  readPendingSignup,
} from '@/lib/analytics/signup-conversion';
import { SignupConversionTracker } from '@/lib/analytics/SignupConversionTracker';
import { trackPlatformFunnelEvent } from '@/lib/analytics/track';
import { isUmamiReady, UMAMI_READY_EVENT } from '@/lib/analytics/umami';

vi.mock('@/lib/analytics/consent', () => ({
  CONSENT_CHANGED_EVENT: 'stagelink:consent-changed',
  isAnalyticsAllowed: vi.fn(),
}));

vi.mock('@/lib/analytics/signup-conversion', () => ({
  clearPendingSignup: vi.fn(),
  isPendingSignupForAccount: vi.fn(),
  readPendingSignup: vi.fn(),
}));

vi.mock('@/lib/analytics/track', () => ({
  trackPlatformFunnelEvent: vi.fn(),
}));

vi.mock('@/lib/analytics/umami', () => ({
  isUmamiReady: vi.fn(),
  UMAMI_READY_EVENT: 'stagelink:umami-ready',
}));

describe('SignupConversionTracker', () => {
  beforeEach(() => {
    vi.mocked(readPendingSignup).mockReset();
    vi.mocked(readPendingSignup).mockReturnValue({ startedAt: 1000 });
    vi.mocked(isPendingSignupForAccount).mockReset();
    vi.mocked(isPendingSignupForAccount).mockReturnValue(true);
    vi.mocked(isAnalyticsAllowed).mockReset();
    vi.mocked(isAnalyticsAllowed).mockReturnValue(true);
    vi.mocked(isUmamiReady).mockReset();
    vi.mocked(isUmamiReady).mockReturnValue(true);
    vi.mocked(trackPlatformFunnelEvent).mockReset();
    vi.mocked(clearPendingSignup).mockReset();
  });

  it('emits a safe signup completion event and clears the marker', () => {
    render(<SignupConversionTracker locale="es" accountCreatedAt="2026-06-04T12:00:03.000Z" />);

    expect(trackPlatformFunnelEvent).toHaveBeenCalledWith(ANALYTICS_EVENTS.AUTH_SIGNUP_COMPLETED, {
      locale: 'es',
      surface: 'signup',
    });
    expect(clearPendingSignup).toHaveBeenCalledOnce();
  });

  it('waits for Umami to be ready before consuming the marker', () => {
    vi.mocked(isUmamiReady).mockReturnValue(false);
    render(<SignupConversionTracker locale="en" accountCreatedAt="2026-06-04T12:00:03.000Z" />);

    expect(trackPlatformFunnelEvent).not.toHaveBeenCalled();
    expect(clearPendingSignup).not.toHaveBeenCalled();

    vi.mocked(isUmamiReady).mockReturnValue(true);
    act(() => window.dispatchEvent(new Event(UMAMI_READY_EVENT)));

    expect(trackPlatformFunnelEvent).toHaveBeenCalledOnce();
    expect(clearPendingSignup).toHaveBeenCalledOnce();
  });

  it('clears the marker without emitting when analytics consent is absent', () => {
    vi.mocked(isAnalyticsAllowed).mockReturnValue(false);
    render(<SignupConversionTracker locale="en" accountCreatedAt="2026-06-04T12:00:03.000Z" />);

    expect(trackPlatformFunnelEvent).not.toHaveBeenCalled();
    expect(clearPendingSignup).toHaveBeenCalledOnce();
  });

  it('clears the marker when the authenticated account predates signup intent', () => {
    vi.mocked(isPendingSignupForAccount).mockReturnValue(false);
    render(<SignupConversionTracker locale="en" accountCreatedAt="2026-05-01T12:00:00.000Z" />);

    expect(trackPlatformFunnelEvent).not.toHaveBeenCalled();
    expect(clearPendingSignup).toHaveBeenCalledOnce();
  });

  it('does nothing without a confirmed authenticated account', () => {
    render(<SignupConversionTracker locale="en" />);

    expect(readPendingSignup).not.toHaveBeenCalled();
    expect(trackPlatformFunnelEvent).not.toHaveBeenCalled();
    expect(clearPendingSignup).not.toHaveBeenCalled();
  });

  it('reacts to consent withdrawal while waiting for Umami', () => {
    vi.mocked(isUmamiReady).mockReturnValue(false);
    render(<SignupConversionTracker locale="en" accountCreatedAt="2026-06-04T12:00:03.000Z" />);

    vi.mocked(isAnalyticsAllowed).mockReturnValue(false);
    act(() => window.dispatchEvent(new Event(CONSENT_CHANGED_EVENT)));

    expect(trackPlatformFunnelEvent).not.toHaveBeenCalled();
    expect(clearPendingSignup).toHaveBeenCalledOnce();
  });
});
