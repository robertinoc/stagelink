import type { ArtistCategory } from '@stagelink/types';

export type { ArtistCategory };

export interface UsernameCheckResponse {
  available: boolean;
  normalizedUsername: string;
  reason?: 'too_short' | 'too_long' | 'invalid_chars' | 'reserved' | 'taken';
}

export interface CompleteOnboardingPayload {
  displayName: string;
  username: string;
  category: ArtistCategory;
  assetId?: string;
}

export interface CompleteOnboardingResponse {
  artistId: string;
  username: string;
  displayName: string;
  pageId: string;
}

export async function checkUsernameAvailability(
  value: string,
  accessToken: string,
): Promise<UsernameCheckResponse> {
  const apiUrl = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:4001';
  const params = new URLSearchParams({ value });
  const res = await fetch(`${apiUrl}/api/onboarding/username-check?${params}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Failed to check username');
  return res.json() as Promise<UsernameCheckResponse>;
}

export async function completeOnboarding(
  payload: CompleteOnboardingPayload,
  accessToken: string,
): Promise<CompleteOnboardingResponse> {
  const apiUrl = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:4001';
  const res = await fetch(`${apiUrl}/api/onboarding/complete`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { message?: string };
    throw new Error(body.message ?? 'Failed to complete onboarding');
  }
  return res.json() as Promise<CompleteOnboardingResponse>;
}
