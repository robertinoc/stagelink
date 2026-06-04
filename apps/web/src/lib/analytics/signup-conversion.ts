'use client';

const PENDING_SIGNUP_STORAGE_KEY = 'stagelink:pending-signup';
const PENDING_SIGNUP_MAX_AGE_MS = 60 * 60 * 1000;
const ACCOUNT_CREATED_CLOCK_SKEW_MS = 5 * 60 * 1000;

export interface PendingSignup {
  startedAt: number;
}

function getSessionStorage(): Storage | null {
  if (typeof window === 'undefined') return null;

  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

export function clearPendingSignup(): void {
  try {
    getSessionStorage()?.removeItem(PENDING_SIGNUP_STORAGE_KEY);
  } catch {
    // Storage failures must never block authentication.
  }
}

export function markSignupPending(): void {
  try {
    getSessionStorage()?.setItem(
      PENDING_SIGNUP_STORAGE_KEY,
      JSON.stringify({ startedAt: Date.now() } satisfies PendingSignup),
    );
  } catch {
    // Storage failures must never block authentication.
  }
}

export function readPendingSignup(now = Date.now()): PendingSignup | null {
  const storage = getSessionStorage();
  if (!storage) return null;

  try {
    const raw = storage.getItem(PENDING_SIGNUP_STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<PendingSignup>;
    const startedAt = Number(parsed.startedAt);
    const age = now - startedAt;

    if (
      !Number.isFinite(startedAt) ||
      age < -ACCOUNT_CREATED_CLOCK_SKEW_MS ||
      age > PENDING_SIGNUP_MAX_AGE_MS
    ) {
      clearPendingSignup();
      return null;
    }

    return { startedAt };
  } catch {
    clearPendingSignup();
    return null;
  }
}

export function isPendingSignupForAccount(
  pendingSignup: PendingSignup,
  accountCreatedAt: string,
  now = Date.now(),
): boolean {
  const createdAt = Date.parse(accountCreatedAt);
  if (!Number.isFinite(createdAt)) return false;

  return (
    createdAt >= pendingSignup.startedAt - ACCOUNT_CREATED_CLOCK_SKEW_MS &&
    createdAt <= now + ACCOUNT_CREATED_CLOCK_SKEW_MS
  );
}
