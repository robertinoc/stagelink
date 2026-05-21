import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TierCard, type TierCardData } from '@/features/dashboard/settings/tabs/plan/TierCard';

const baseTier: TierCardData = {
  id: 'pro',
  name: 'Pro',
  price: '$5',
  sub: 'Step up from Free',
  features: ['Remove branding', 'Custom domain'],
};

describe('TierCard', () => {
  it('marks the current plan with the "Plan actual" green pill + disabled CTA', () => {
    render(
      <TierCard
        tier={baseTier}
        isCurrent
        ctaLabel="Cambiar de plan"
        currentLabel="Plan actual"
        popularLabel="POPULAR"
      />,
    );
    // "Plan actual" appears twice on a current tier — once as the green
    // pill, once as the disabled CTA label. Assert both occurrences exist
    // and the CTA button specifically is disabled.
    expect(screen.getAllByText('Plan actual')).toHaveLength(2);
    const button = screen.getByRole('button', { name: 'Plan actual' });
    expect(button).toBeDisabled();
  });

  it('shows the POPULAR pill on a popular non-current tier', () => {
    render(
      <TierCard
        tier={{ ...baseTier, popular: true }}
        isCurrent={false}
        ctaLabel="Upgrade"
        currentLabel="Plan actual"
        popularLabel="POPULAR"
      />,
    );
    expect(screen.getByText('POPULAR')).toBeInTheDocument();
    expect(screen.queryByText('Plan actual')).not.toBeInTheDocument();
  });

  it('renders the ctaLabel on idle tiers when no ctaAction override is provided', () => {
    render(
      <TierCard
        tier={baseTier}
        isCurrent={false}
        ctaLabel="Managed via billing"
        currentLabel="Plan actual"
        popularLabel="POPULAR"
      />,
    );
    expect(screen.getByRole('button', { name: 'Managed via billing' })).toBeEnabled();
  });

  it('renders every feature as a list item', () => {
    render(
      <TierCard
        tier={baseTier}
        isCurrent={false}
        ctaLabel="Upgrade"
        currentLabel="Plan actual"
        popularLabel="POPULAR"
      />,
    );
    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(baseTier.features.length);
    expect(items[0]).toHaveTextContent('Remove branding');
    expect(items[1]).toHaveTextContent('Custom domain');
  });
});
