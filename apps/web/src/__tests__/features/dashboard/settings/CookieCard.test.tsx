import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { CookieCard } from '@/features/dashboard/settings/tabs/privacy/CookieCard';

const labels = {
  lockedLabel: 'Siempre activo',
  activeLabel: 'ACTIVO',
  inactiveLabel: 'DESACTIVADO',
  switchAriaLabel: 'Analytics',
};

describe('CookieCard', () => {
  it('renders the locked pill and no toggle when state is locked', () => {
    render(
      <CookieCard
        label="Necesarias"
        description="Required for auth and security."
        state="locked"
        {...labels}
      />,
    );
    expect(screen.getByText(/Siempre activo/)).toBeInTheDocument();
    expect(screen.queryByRole('switch')).not.toBeInTheDocument();
  });

  it('renders an on switch and ACTIVE status when state is on', () => {
    const onChange = vi.fn();
    render(
      <CookieCard
        label="Analytics"
        description="Optional analytics."
        state="on"
        onChange={onChange}
        {...labels}
      />,
    );
    const sw = screen.getByRole('switch', { name: 'Analytics' });
    expect(sw).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByText(/ACTIVO/)).toBeInTheDocument();
  });

  it('toggles to off when clicked from on state', () => {
    const onChange = vi.fn();
    render(
      <CookieCard
        label="Marketing"
        description="Optional marketing."
        state="on"
        onChange={onChange}
        {...labels}
      />,
    );
    fireEvent.click(screen.getByRole('switch'));
    expect(onChange).toHaveBeenCalledWith(false);
  });

  it('toggles to on when clicked from off state', () => {
    const onChange = vi.fn();
    render(
      <CookieCard
        label="Marketing"
        description="Optional marketing."
        state="off"
        onChange={onChange}
        {...labels}
      />,
    );
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'false');
    expect(screen.getByText(/DESACTIVADO/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('switch'));
    expect(onChange).toHaveBeenCalledWith(true);
  });
});
