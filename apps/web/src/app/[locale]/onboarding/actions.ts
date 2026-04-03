'use server';

import { getSession } from '@/lib/auth';
import type {
  CompleteOnboardingPayload,
  CompleteOnboardingResponse,
  CompleteOnboardingActionResult,
} from '@/lib/api/onboarding';
import { resolveApiBaseUrl } from '@/lib/server/api-base-url';

export async function completeOnboardingAction(
  payload: CompleteOnboardingPayload,
): Promise<CompleteOnboardingActionResult> {
  const session = await getSession();
  if (!session) {
    console.error('[onboarding][action] Missing session in server action');
    return { ok: false, error: 'You must be signed in to complete onboarding.' };
  }

  console.error('[onboarding][action] Session resolved', {
    userId: session.user.id,
    hasAccessToken: Boolean(session.accessToken),
    accessTokenLength: session.accessToken?.length ?? 0,
    accessTokenLooksJwt: session.accessToken?.includes('.') ?? false,
  });

  const apiBaseUrl = resolveApiBaseUrl();
  if (!apiBaseUrl) {
    return { ok: false, error: 'Onboarding is not configured on this deployment.' };
  }
  const response = await fetch(`${apiBaseUrl}/api/onboarding/complete`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${session.accessToken}`,
    },
    body: JSON.stringify(payload),
    cache: 'no-store',
  });

  if (!response.ok) {
    const rawBody = await response.text();
    console.error('[onboarding][action] Backend onboarding failed', {
      status: response.status,
      body: rawBody,
    });

    let parsedBody: { message?: string | string[] } = {};
    try {
      parsedBody = JSON.parse(rawBody) as { message?: string | string[] };
    } catch {
      // Ignore JSON parse failures and fall back to the raw body below.
    }

    const message = Array.isArray(parsedBody.message)
      ? parsedBody.message.join(', ')
      : (parsedBody.message ?? rawBody ?? 'Failed to complete onboarding');
    return { ok: false, error: message };
  }

  return {
    ok: true,
    data: (await response.json()) as CompleteOnboardingResponse,
  };
}
