import {
  ExternalRequestTimeoutError,
  fetchWithTimeout,
  isExternalRequestTimeout,
} from './external-fetch';

describe('fetchWithTimeout', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('returns the fetch response before the timeout elapses', async () => {
    const response = { ok: true } as Response;
    const fetchImpl = jest.fn().mockResolvedValue(response);

    await expect(
      fetchWithTimeout('https://example.com', { method: 'GET' }, { fetchImpl }),
    ).resolves.toBe(response);

    expect(fetchImpl).toHaveBeenCalledWith(
      'https://example.com',
      expect.objectContaining({
        method: 'GET',
        signal: expect.any(AbortSignal),
      }),
    );
  });

  it('aborts and throws a typed timeout error when the deadline elapses', async () => {
    const fetchImpl = jest.fn((_input: Parameters<typeof fetch>[0], init?: RequestInit) => {
      return new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => {
          reject(new DOMException('Aborted', 'AbortError'));
        });
      });
    });

    let caughtError: unknown;
    const request = fetchWithTimeout('https://example.com/slow', undefined, {
      fetchImpl,
      timeoutMs: 50,
      timeoutMessage: 'Provider timed out',
    }).catch((error: unknown) => {
      caughtError = error;
    });

    await jest.advanceTimersByTimeAsync(50);
    await request;

    expect(caughtError).toBeInstanceOf(ExternalRequestTimeoutError);
    expect(caughtError).toHaveProperty('message', 'Provider timed out');
    expect(isExternalRequestTimeout(caughtError)).toBe(true);
  });
});
