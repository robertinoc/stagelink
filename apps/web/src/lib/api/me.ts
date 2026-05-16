import { apiFetch } from '@/lib/auth';

/**
 * Shape of the /api/auth/me response.
 * Defined once here and imported everywhere — prevents drift when
 * the backend adds new fields (e.g. role, defaultArtistId).
 */
export interface AuthMeResponse {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
  artistIds: string[];
  isSuspended?: boolean;
  isDeleted?: boolean;
  createdAt: string;
}

export function getCurrentArtistId(me: AuthMeResponse | null): string | null {
  return me?.artistIds[0] ?? null;
}

/**
 * Fetches the current user's identity from the backend.
 * Returns null if the request fails for any reason.
 *
 * Special case: a 403 from /api/auth/me means the JWT guard blocked the
 * request because the account is suspended. We return a minimal object
 * with isSuspended: true so the layout can redirect to /suspended instead
 * of crashing when downstream API calls also fail with 403.
 */
export async function getAuthMe(accessToken: string): Promise<AuthMeResponse | null> {
  try {
    const res = await apiFetch('/api/auth/me', { accessToken });
    if (res.status === 403) {
      // Account suspended — synthesise enough info to trigger the layout guard.
      return {
        id: '',
        email: '',
        firstName: null,
        lastName: null,
        avatarUrl: null,
        artistIds: [],
        isSuspended: true,
        isDeleted: false,
        createdAt: new Date().toISOString(),
      };
    }
    if (!res.ok) return null;
    return res.json() as Promise<AuthMeResponse>;
  } catch {
    return null;
  }
}
