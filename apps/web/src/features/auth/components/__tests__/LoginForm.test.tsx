import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ANALYTICS_EVENTS } from '@stagelink/types';
import { trackPlatformFunnelEvent } from '@/lib/analytics/track';
import { LoginForm } from '../LoginForm';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) =>
    ({
      submit: 'Continue with WorkOS',
      no_account: 'No account?',
      signup_link: 'Sign up',
    })[key] ?? key,
}));

vi.mock('@/lib/analytics/track', () => ({
  trackPlatformFunnelEvent: vi.fn(),
}));

describe('LoginForm', () => {
  it('renders translated submit and signup link for the active locale', () => {
    render(<LoginForm action={vi.fn()} locale="es" />);

    expect(screen.getByRole('button', { name: 'Continue with WorkOS' })).toBeInTheDocument();
    expect(screen.getByText('No account?')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Sign up' })).toHaveAttribute('href', '/es/signup');
  });

  it('renders an accessible auth error when provided', () => {
    render(<LoginForm action={vi.fn()} locale="en" errorMessage="Authentication failed" />);

    expect(screen.getByRole('alert')).toHaveTextContent('Authentication failed');
  });

  it('tracks login funnel intent without PII', async () => {
    const user = userEvent.setup();
    render(<LoginForm action={vi.fn()} locale="es" />);

    await user.click(screen.getByRole('button', { name: 'Continue with WorkOS' }));
    await user.click(screen.getByRole('link', { name: 'Sign up' }));

    expect(trackPlatformFunnelEvent).toHaveBeenNthCalledWith(
      1,
      ANALYTICS_EVENTS.AUTH_LOGIN_STARTED,
      {
        locale: 'es',
        surface: 'login',
      },
    );
    expect(trackPlatformFunnelEvent).toHaveBeenNthCalledWith(
      2,
      ANALYTICS_EVENTS.AUTH_LOGIN_SIGNUP_CLICKED,
      {
        locale: 'es',
        surface: 'login',
      },
    );
  });
});
