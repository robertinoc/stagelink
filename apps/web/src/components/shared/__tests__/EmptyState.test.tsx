import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { EmptyState } from '../EmptyState';

describe('EmptyState', () => {
  it('renders required and optional copy', () => {
    render(<EmptyState title="No links yet" description="Add your first public link." />);

    expect(screen.getByRole('heading', { name: 'No links yet' })).toBeInTheDocument();
    expect(screen.getByText('Add your first public link.')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('renders an action button and calls its handler on click', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();

    render(<EmptyState title="No blocks" action={{ label: 'Add block', onClick }} />);

    await user.click(screen.getByRole('button', { name: 'Add block' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('merges custom classes into the root element', () => {
    const { container } = render(<EmptyState title="Empty" className="min-h-64" />);

    expect(container.firstElementChild).toHaveClass('min-h-64');
  });
});
