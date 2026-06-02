import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ANALYTICS_EVENTS } from '@stagelink/types';
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

describe('SignupForm', () => {
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
  });
});
