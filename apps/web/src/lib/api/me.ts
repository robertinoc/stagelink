import { unstable_cache } from 'next/cache';
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

const SUSPENDED_PLACEHOLDER: AuthMeResponse = {
  id: '',
  email: '',
  firstName: null,
  lastName: null,
  avatarUrl: null,
  artistIds: [],
  isSuspended: true,
  isDeleted: false,
  createdAt: '',
};

/**
 * Stable per-session fingerprint of the access token. Used as the cache key
 * so different users never share a cached `me` response, while the same
 * session keeps hitting the cache across navigations. A token refresh creates
 * a new fingerprint and the previous entry expires on its own TTL.
 */
function tokenFingerprint(accessToken: string): string {
  return accessToken.slice(-24);
}

/**
 * Fetches the current user's identity from the backend.
 * Returns null if the request fails for any reason.
 *
 * Cached for 60 s server-side via `unstable_cache`, keyed by a token
 * fingerprint so navigations within a session reuse the same entry.
 *
 * Special case: a 403 from /api/auth/me means the JWT guard blocked the
 * request because the account is suspended. We return a minimal object
 * with isSuspended: true so the layout can redirect to /suspended instead
 * of crashing when downstream API calls also fail with 403. The placeholder
 * uses a fixed createdAt to keep cache reads deterministic.
 */
export async function getAuthMe(accessToken: string): Promise<AuthMeResponse | null> {
  const fingerprint = tokenFingerprint(accessToken);
  return unstable_cache(
    async () => {
      try {
        const res = await apiFetch('/api/auth/me', { accessToken });
        if (res.status === 403) {
          return SUSPENDED_PLACEHOLDER;
        }
        if (!res.ok) return null;
        return (await res.json()) as AuthMeResponse;
      } catch {
        return null;
      }
    },
    ['auth:me', fingerprint],
    { tags: [`auth:me:${fingerprint}`], revalidate: 60 },
  )();
}
