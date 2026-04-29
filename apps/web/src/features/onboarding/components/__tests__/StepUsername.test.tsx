import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { StepUsername } from '../StepUsername';
import { useUsernameCheck } from '../../hooks/useUsernameCheck';

vi.mock('../../hooks/useUsernameCheck', () => ({
  useUsernameCheck: vi.fn(),
}));

const mockedUseUsernameCheck = vi.mocked(useUsernameCheck);

describe('StepUsername', () => {
  it('renders availability feedback and continues with the normalized username', async () => {
    const user = userEvent.setup();
    const onNext = vi.fn();
    const onBack = vi.fn();

    mockedUseUsernameCheck.mockReturnValue({
      state: 'available',
      result: { available: true, normalizedUsername: 'stage-link' },
      normalizedValue: 'stage-link',
    });

    render(<StepUsername initialValue="Stage-Link" onNext={onNext} onBack={onBack} />);

    expect(screen.getByText('✓ stage-link is available')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    expect(onNext).toHaveBeenCalledWith('stage-link');
  });

  it('lowercases typed input before checking availability', async () => {
    const user = userEvent.setup();

    mockedUseUsernameCheck.mockReturnValue({
      state: 'idle',
      result: null,
      normalizedValue: '',
    });

    render(<StepUsername initialValue="" onNext={vi.fn()} onBack={vi.fn()} />);
    await user.type(screen.getByLabelText('Username'), 'StageLink');

    expect(screen.getByLabelText('Username')).toHaveValue('stagelink');
  });

  it('blocks continue and shows mapped reason copy when unavailable', () => {
    mockedUseUsernameCheck.mockReturnValue({
      state: 'unavailable',
      result: { available: false, normalizedUsername: 'admin', reason: 'reserved' },
      normalizedValue: 'admin',
    });

    render(<StepUsername initialValue="admin" onNext={vi.fn()} onBack={vi.fn()} />);

    expect(screen.getByText('This username is reserved.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Continue' })).toBeDisabled();
  });

  it('allows fallback continue after check errors when the local format is valid', async () => {
    const user = userEvent.setup();
    const onNext = vi.fn();

    mockedUseUsernameCheck.mockReturnValue({
      state: 'error',
      result: null,
      normalizedValue: 'valid_name',
    });

    render(<StepUsername initialValue="valid_name" onNext={onNext} onBack={vi.fn()} />);

    expect(screen.getByText(/Could not verify availability right now/i)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    expect(onNext).toHaveBeenCalledWith('valid_name');
  });

  it('calls the back handler from the secondary action', async () => {
    const user = userEvent.setup();
    const onBack = vi.fn();

    mockedUseUsernameCheck.mockReturnValue({
      state: 'idle',
      result: null,
      normalizedValue: '',
    });

    render(<StepUsername initialValue="" onNext={vi.fn()} onBack={onBack} />);
    await user.click(screen.getByRole('button', { name: 'Back' }));

    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
