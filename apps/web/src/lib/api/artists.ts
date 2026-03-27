import { apiFetch } from '@/lib/auth';

export interface Artist {
  id: string;
  displayName: string;
  username: string;
  avatarUrl: string | null;
  coverUrl: string | null;
  category: string;
}

/**
 * Fetches an artist by ID from the backend.
 * Returns null on any error (network issue, 404, unauthorised, etc.).
 * Safe to call from server layouts — failures degrade gracefully.
 */
export async function getArtist(artistId: string, accessToken: string): Promise<Artist | null> {
  try {
    const res = await apiFetch(`/api/artists/${artistId}`, { accessToken });
    if (!res.ok) return null;
    return res.json() as Promise<Artist>;
  } catch {
    return null;
  }
}
