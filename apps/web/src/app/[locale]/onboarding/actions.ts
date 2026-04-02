'use server';

import { getSession } from '@/lib/auth';
import type {
  CompleteOnboardingPayload,
  CompleteOnboardingResponse,
} from '@/lib/api/onboarding';

function resolveApiBaseUrl(): string {
  const configuredUrl = process.env['API_URL'] ?? process.env['NEXT_PUBLIC_API_URL'];
  if (!configuredUrl) {
    throw new Error('Onboarding is not configured on this deployment.');
  }

  const trimmedUrl = configuredUrl.replace(/\/+$/, '');
  return trimmedUrl.endsWith('/api') ? trimmedUrl.slice(0, -4) : trimmedUrl;
}

export async function completeOnboardingAction(
  payload: CompleteOnboardingPayload,
): Promise<CompleteOnboardingResponse> {
  const session = await getSession();
  if (!session) {
    throw new Error('You must be signed in to complete onboarding.');
  }

  const apiBaseUrl = resolveApiBaseUrl();
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
    const body = (await response.json().catch(() => ({}))) as { message?: string | string[] };
    const message = Array.isArray(body.message)
      ? body.message.join(', ')
      : (body.message ?? 'Failed to complete onboarding');
    throw new Error(message);
  }

  return response.json() as Promise<CompleteOnboardingResponse>;
}
