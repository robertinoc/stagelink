export const DEFAULT_EXTERNAL_REQUEST_TIMEOUT_MS = 5_000;

type FetchLike = typeof fetch;
type FetchInput = Parameters<FetchLike>[0];
type FetchInit = Parameters<FetchLike>[1];

export class ExternalRequestTimeoutError extends Error {
  constructor(message = 'External request timed out') {
    super(message);
    this.name = 'ExternalRequestTimeoutError';
  }
}

export interface FetchWithTimeoutOptions {
  timeoutMs?: number;
  timeoutMessage?: string;
  fetchImpl?: FetchLike;
}

export async function fetchWithTimeout(
  input: FetchInput,
  init: FetchInit = {},
  options: FetchWithTimeoutOptions = {},
): Promise<Response> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const timeoutMs = options.timeoutMs ?? DEFAULT_EXTERNAL_REQUEST_TIMEOUT_MS;

  if (timeoutMs <= 0) {
    return fetchImpl(input, init);
  }

  const controller = new AbortController();
  let timedOut = false;
  const timeout = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);

  try {
    return await fetchImpl(input, {
      ...init,
      signal: controller.signal,
    });
  } catch (error) {
    if (timedOut) {
      throw new ExternalRequestTimeoutError(options.timeoutMessage);
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export function isExternalRequestTimeout(error: unknown): error is ExternalRequestTimeoutError {
  return error instanceof ExternalRequestTimeoutError;
}
