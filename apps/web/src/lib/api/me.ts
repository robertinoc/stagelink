import { apiFetch } from '@/lib/auth';

/**
 * Shape of the /api/auth/me response.
 * Defined once here and imported everywhere — prevents drift when
 * the backend adds new fields (e.g. role, defaultArtistId).
 */
export interface AuthMeResponse {
  artistIds: string[];
  isSuspended?: boolean;
}

export function getCurrentArtistId(me: AuthMeResponse | null): string | null {
  return me?.artistIds[0] ?? null;
}

/**
 * Fetches the current user's identity from the backend.
 * Returns null if the request fails for any reason.
 */
export async function getAuthMe(accessToken: string): Promise<AuthMeResponse | null> {
  try {
    const res = await apiFetch('/api/auth/me', { accessToken });
    if (!res.ok) return null;
    return res.json() as Promise<AuthMeResponse>;
  } catch {
    return null;
  }
}
