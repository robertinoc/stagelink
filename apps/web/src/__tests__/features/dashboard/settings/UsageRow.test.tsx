import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { UsageRow } from '@/features/dashboard/settings/tabs/plan/UsageRow';

describe('UsageRow', () => {
  it('renders bounded usage with formatted "value / max" label', () => {
    render(<UsageRow label="Pages" value={1} max={3} />);
    expect(screen.getByText('Pages')).toBeInTheDocument();
    expect(screen.getByText('1 / 3')).toBeInTheDocument();
    const bar = screen.getByRole('progressbar', { name: 'Pages' });
    expect(bar).toHaveAttribute('aria-valuenow', '1');
    expect(bar).toHaveAttribute('aria-valuemax', '3');
  });

  it('renders unlimited usage with ∞ symbol and striped fill class', () => {
    render(<UsageRow label="Smart Links" value={142} max={null} />);
    expect(screen.getByText('142 / ∞')).toBeInTheDocument();
    const bar = screen.getByRole('progressbar', { name: 'Smart Links' });
    // Striped fill is a child div with the repeating-linear-gradient class
    expect(bar.querySelector('div')?.className).toMatch(/repeating-linear-gradient/);
  });

  it('caps the rendered width at 100% when value exceeds max', () => {
    render(<UsageRow label="Storage" value={5000} max={1024} unit="MB" maxLabel="1 GB" />);
    expect(screen.getByText('5,000 MB / 1 GB')).toBeInTheDocument();
    const fill = screen
      .getByRole('progressbar', { name: 'Storage' })
      .querySelector('div') as HTMLDivElement;
    expect(fill.style.width).toBe('100%');
  });

  it('uses 0 width when max is 0 to avoid divide-by-zero artefacts', () => {
    render(<UsageRow label="Empty" value={3} max={0} />);
    const fill = screen
      .getByRole('progressbar', { name: 'Empty' })
      .querySelector('div') as HTMLDivElement;
    expect(fill.style.width).toBe('0%');
  });
});
