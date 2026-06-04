import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ANALYTICS_EVENTS } from '@stagelink/types';
import { isAnalyticsAllowed } from '@/lib/analytics/consent';
import { markSignupPending } from '@/lib/analytics/signup-conversion';
import { trackPlatformFunnelEvent } from '@/lib/analytics/track';
import { SignupForm } from '../SignupForm';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) =>
    ({
      submit: 'Create account',
      have_account: 'Already have an account?',
      login_link: 'Sign in',
    })[key] ?? key,
}));

vi.mock('@/lib/analytics/track', () => ({
  trackPlatformFunnelEvent: vi.fn(),
}));

vi.mock('@/lib/analytics/consent', () => ({
  isAnalyticsAllowed: vi.fn(),
}));

vi.mock('@/lib/analytics/signup-conversion', () => ({
  markSignupPending: vi.fn(),
}));

describe('SignupForm', () => {
  beforeEach(() => {
    vi.mocked(isAnalyticsAllowed).mockReturnValue(true);
    vi.mocked(markSignupPending).mockReset();
    vi.mocked(trackPlatformFunnelEvent).mockReset();
  });

  it('tracks signup funnel intent without PII', async () => {
    const user = userEvent.setup();
    render(<SignupForm action={vi.fn()} locale="en" />);

    await user.click(screen.getByRole('button', { name: 'Create account' }));
    await user.click(screen.getByRole('link', { name: 'Sign in' }));

    expect(trackPlatformFunnelEvent).toHaveBeenNthCalledWith(
      1,
      ANALYTICS_EVENTS.AUTH_SIGNUP_STARTED,
      {
        locale: 'en',
        surface: 'signup',
      },
    );
    expect(trackPlatformFunnelEvent).toHaveBeenNthCalledWith(
      2,
      ANALYTICS_EVENTS.AUTH_SIGNUP_LOGIN_CLICKED,
      {
        locale: 'en',
        surface: 'signup',
      },
    );
    expect(markSignupPending).toHaveBeenCalledOnce();
  });

  it('does not create an analytics conversion marker without consent', async () => {
    vi.mocked(isAnalyticsAllowed).mockReturnValue(false);
    const user = userEvent.setup();
    render(<SignupForm action={vi.fn()} locale="es" />);

    await user.click(screen.getByRole('button', { name: 'Create account' }));

    expect(markSignupPending).not.toHaveBeenCalled();
  });
});
