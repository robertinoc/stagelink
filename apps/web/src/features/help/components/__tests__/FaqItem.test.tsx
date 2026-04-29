import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { FaqItem } from '../FaqItem';

describe('FaqItem', () => {
  it('renders the question and keeps the answer collapsed initially', () => {
    render(<FaqItem question="Can I use my own domain?" answer="Custom domains are planned." />);

    expect(screen.getByRole('button', { name: 'Can I use my own domain?' })).toBeInTheDocument();
    expect(screen.queryByText('Custom domains are planned.')).not.toBeInTheDocument();
  });

  it('toggles the answer when the question is clicked', async () => {
    const user = userEvent.setup();
    render(<FaqItem question="How does billing work?" answer="Stripe manages subscriptions." />);

    const trigger = screen.getByRole('button', { name: 'How does billing work?' });
    await user.click(trigger);
    expect(screen.getByText('Stripe manages subscriptions.')).toBeInTheDocument();

    await user.click(trigger);
    expect(screen.queryByText('Stripe manages subscriptions.')).not.toBeInTheDocument();
  });
});
