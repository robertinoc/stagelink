import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useUnsavedChangesGuard } from '../useUnsavedChangesGuard';

function GuardHarness({ enabled = true }: { enabled?: boolean }) {
  useUnsavedChangesGuard({ enabled, message: 'Leave this page?' });

  return (
    <div>
      <a href="https://stagelink.art/dashboard">Dashboard</a>
      <a href="#section">Section</a>
      <a href="/public" target="_blank" rel="noreferrer">
        Public
      </a>
    </div>
  );
}

describe('useUnsavedChangesGuard', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('blocks same-tab anchor navigation when the user rejects the prompt', () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
    render(<GuardHarness />);

    const event = new MouseEvent('click', { bubbles: true, cancelable: true, button: 0 });
    const allowed = screen.getByRole('link', { name: 'Dashboard' }).dispatchEvent(event);

    expect(allowed).toBe(false);
    expect(confirmSpy).toHaveBeenCalledWith('Leave this page?');
  });

  it('registers the browser unload guard while enabled', () => {
    const confirmSpy = vi.spyOn(window, 'confirm');
    render(<GuardHarness />);

    const event = new Event('beforeunload', { cancelable: true });
    const allowed = window.dispatchEvent(event);

    expect(allowed).toBe(false);
    expect(confirmSpy).not.toHaveBeenCalled();
  });

  it('does not prompt for in-page or new-tab anchors', () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
    render(<GuardHarness />);

    screen
      .getByRole('link', { name: 'Section' })
      .dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, button: 0 }));
    screen
      .getByRole('link', { name: 'Public' })
      .dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, button: 0 }));

    expect(confirmSpy).not.toHaveBeenCalled();
  });

  it('does not prompt when disabled', () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
    render(<GuardHarness enabled={false} />);

    const event = new MouseEvent('click', { bubbles: true, cancelable: true, button: 0 });
    const allowed = screen.getByRole('link', { name: 'Section' }).dispatchEvent(event);

    expect(allowed).toBe(true);
    expect(confirmSpy).not.toHaveBeenCalled();
  });
});
