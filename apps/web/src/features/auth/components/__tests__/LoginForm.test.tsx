import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { LoginForm } from '../LoginForm';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) =>
    ({
      submit: 'Continue with WorkOS',
      no_account: 'No account?',
      signup_link: 'Sign up',
    })[key] ?? key,
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
});
