import { apiFetch } from '@/lib/auth';
import type { ArtistCategory, ArtistTranslations } from '@stagelink/types';

/**
 * Full artist data returned by GET /api/artists/:id.
 * Mirrors the Artist model from the API (all nullable fields explicit).
 */
export interface Artist {
  id: string;
  userId: string;
  username: string;
  displayName: string;
  bio: string | null;
  category: ArtistCategory;
  avatarUrl: string | null;
  coverUrl: string | null;
  // Social links
  instagramUrl: string | null;
  tiktokUrl: string | null;
  youtubeUrl: string | null;
  spotifyUrl: string | null;
  soundcloudUrl: string | null;
  websiteUrl: string | null;
  contactEmail: string | null;
  // SEO
  seoTitle: string | null;
  seoDescription: string | null;
  translations: ArtistTranslations;
  secondaryCategories: ArtistCategory[];
  createdAt: string;
  updatedAt: string;
}

/** Payload accepted by PATCH /api/artists/:id. All fields optional. */
export interface UpdateArtistPayload {
  displayName?: string;
  bio?: string | null;
  category?: ArtistCategory;
  secondaryCategories?: ArtistCategory[];
  instagramUrl?: string | null;
  tiktokUrl?: string | null;
  youtubeUrl?: string | null;
  spotifyUrl?: string | null;
  soundcloudUrl?: string | null;
  websiteUrl?: string | null;
  contactEmail?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  translations?: ArtistTranslations;
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

/**
 * Updates artist profile fields via PATCH /api/artists/:id.
 * Throws on non-2xx responses with the backend error message when available.
 */
export async function updateArtist(
  artistId: string,
  payload: UpdateArtistPayload,
): Promise<Artist> {
  const res = await fetch(`/api/artists/${artistId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    cache: 'no-store',
  });

  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { message?: string | string[] };
    const message = Array.isArray(err.message)
      ? err.message.join(', ')
      : (err.message ?? `Update failed (${res.status})`);
    throw new Error(message);
  }

  return res.json() as Promise<Artist>;
}
