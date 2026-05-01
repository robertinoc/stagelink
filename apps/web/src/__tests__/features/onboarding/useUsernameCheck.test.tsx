import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useUsernameCheck } from '@/features/onboarding/hooks/useUsernameCheck';

// ---------------------------------------------------------------------------
// Mock the API call — we test hook logic, not the network layer
// ---------------------------------------------------------------------------

vi.mock('@/lib/api/onboarding', () => ({
  checkUsernameAvailability: vi.fn(),
}));

import { checkUsernameAvailability } from '@/lib/api/onboarding';
const mockCheckAvailability = vi.mocked(checkUsernameAvailability);

/**
 * Helper: advance fake timers past the 500ms debounce AND flush all pending
 * microtasks (Promise resolutions from the async API call).
 *
 * vi.runAllTimersAsync() fires every pending timer and awaits any Promises
 * they schedule — eliminating the waitFor + fake-timer incompatibility.
 */
async function flushDebounce() {
  await act(async () => {
    await vi.runAllTimersAsync();
  });
}

describe('useUsernameCheck()', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockCheckAvailability.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // ── Initial state ────────────────────────────────────────────────────────

  it('starts in "idle" state with empty normalizedValue', () => {
    const { result } = renderHook(() => useUsernameCheck(''));
    expect(result.current.state).toBe('idle');
    expect(result.current.result).toBeNull();
    expect(result.current.normalizedValue).toBe('');
  });

  it('stays "idle" for input shorter than 3 characters', () => {
    const { result } = renderHook(() => useUsernameCheck('ab'));
    expect(result.current.state).toBe('idle');
    expect(mockCheckAvailability).not.toHaveBeenCalled();
  });

  it('stays "idle" for a single character', () => {
    const { result } = renderHook(() => useUsernameCheck('a'));
    expect(result.current.state).toBe('idle');
  });

  // ── Normalisation ────────────────────────────────────────────────────────

  it('normalizes input to lowercase and trimmed', () => {
    const { result } = renderHook(() => useUsernameCheck('  ABC  '));
    // normalizedValue is set synchronously in the effect (before the debounce fires)
    expect(result.current.normalizedValue).toBe('abc');
  });

  // ── Debounce: "checking" state ───────────────────────────────────────────

  it('sets state to "checking" immediately for input ≥ 3 chars', () => {
    const { result } = renderHook(() => useUsernameCheck('djshadow'));
    expect(result.current.state).toBe('checking');
    expect(mockCheckAvailability).not.toHaveBeenCalled(); // debounce not fired yet
  });

  it('calls checkUsernameAvailability after the 500ms debounce', async () => {
    mockCheckAvailability.mockResolvedValue({ available: true, normalizedUsername: 'djshadow' });

    renderHook(() => useUsernameCheck('djshadow'));

    expect(mockCheckAvailability).not.toHaveBeenCalled();
    await flushDebounce();
    expect(mockCheckAvailability).toHaveBeenCalledWith('djshadow');
    expect(mockCheckAvailability).toHaveBeenCalledTimes(1);
  });

  // ── Available username ───────────────────────────────────────────────────

  it('sets state to "available" when API returns available=true', async () => {
    mockCheckAvailability.mockResolvedValue({ available: true, normalizedUsername: 'djshadow' });

    const { result } = renderHook(() => useUsernameCheck('djshadow'));
    await flushDebounce();

    expect(result.current.state).toBe('available');
    expect(result.current.result?.available).toBe(true);
    expect(result.current.normalizedValue).toBe('djshadow');
  });

  // ── Unavailable username ─────────────────────────────────────────────────

  it('sets state to "unavailable" when API returns available=false', async () => {
    mockCheckAvailability.mockResolvedValue({ available: false, normalizedUsername: 'djshadow' });

    const { result } = renderHook(() => useUsernameCheck('djshadow'));
    await flushDebounce();

    expect(result.current.state).toBe('unavailable');
    expect(result.current.result?.available).toBe(false);
  });

  // ── Error handling ───────────────────────────────────────────────────────

  it('sets state to "error" when API call throws', async () => {
    mockCheckAvailability.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useUsernameCheck('djshadow'));
    await flushDebounce();

    expect(result.current.state).toBe('error');
    expect(result.current.result).toBeNull();
  });

  // ── Debounce cancellation ────────────────────────────────────────────────

  it('cancels pending debounce when input changes before 500ms', async () => {
    mockCheckAvailability.mockResolvedValue({ available: true, normalizedUsername: 'djshadow2' });

    const { rerender } = renderHook(({ value }) => useUsernameCheck(value), {
      initialProps: { value: 'djshado' },
    });

    // Advance only 200ms — debounce still pending
    await act(async () => {
      vi.advanceTimersByTime(200);
    });

    // Change the input — previous debounce is cancelled
    rerender({ value: 'djshadow2' });

    // Now flush the new debounce
    await flushDebounce();

    // Only called once, with the final value
    expect(mockCheckAvailability).toHaveBeenCalledTimes(1);
    expect(mockCheckAvailability).toHaveBeenCalledWith('djshadow2');
  });

  // ── Resets on short input ────────────────────────────────────────────────

  it('resets to "idle" and clears result when input drops below 3 chars', async () => {
    mockCheckAvailability.mockResolvedValue({ available: true, normalizedUsername: 'djshadow' });

    const { result, rerender } = renderHook(({ value }) => useUsernameCheck(value), {
      initialProps: { value: 'djshadow' },
    });

    await flushDebounce();
    expect(result.current.state).toBe('available');

    // Drop below minimum length
    act(() => {
      rerender({ value: 'dj' });
    });

    expect(result.current.state).toBe('idle');
    expect(result.current.result).toBeNull();
  });
});
