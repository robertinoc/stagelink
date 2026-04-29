import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { StepName } from '../StepName';

describe('StepName', () => {
  it('renders the initial value and submits the trimmed artist name', async () => {
    const user = userEvent.setup();
    const onNext = vi.fn();

    render(<StepName initialValue="  The Midnight  " onNext={onNext} />);

    expect(screen.getByLabelText('Artist name')).toHaveValue('  The Midnight  ');
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    expect(onNext).toHaveBeenCalledWith('The Midnight');
  });

  it('shows an error and disables continue when the value is only whitespace', () => {
    const onNext = vi.fn();

    render(<StepName initialValue="" onNext={onNext} />);
    fireEvent.change(screen.getByLabelText('Artist name'), { target: { value: '   ' } });

    expect(screen.getByText('Name cannot be empty.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Continue' })).toBeDisabled();
  });

  it('submits with Enter only when the current value is valid', () => {
    const onNext = vi.fn();

    render(<StepName initialValue="" onNext={onNext} />);
    const input = screen.getByLabelText('Artist name');

    fireEvent.change(input, { target: { value: '   ' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onNext).not.toHaveBeenCalled();

    fireEvent.change(input, { target: { value: 'Rosalia' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onNext).toHaveBeenCalledWith('Rosalia');
  });
});
