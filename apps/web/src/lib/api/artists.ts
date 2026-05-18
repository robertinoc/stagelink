import { unstable_cache } from 'next/cache';
import { apiFetch } from '@/lib/auth';
import type {
  ArtistCategory,
  ArtistRelease,
  ArtistTranslations,
  RecordLabel,
  SupportedLocale,
} from '@stagelink/types';

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
  fullBio: string | null;
  baseLocale: SupportedLocale;
  category: ArtistCategory;
  secondaryCategories: ArtistCategory[];
  tags: string[];
  avatarUrl: string | null;
  coverUrl: string | null;
  galleryImageUrls: string[];
  // Social links
  instagramUrl: string | null;
  tiktokUrl: string | null;
  youtubeUrl: string | null;
  spotifyUrl: string | null;
  soundcloudUrl: string | null;
  websiteUrl: string | null;
  contactEmail: string | null;
  // Streaming platforms (REQ-06)
  appleMusicUrl: string | null;
  amazonMusicUrl: string | null;
  deezerUrl: string | null;
  tidalUrl: string | null;
  // Music stores (REQ-07)
  beatportUrl: string | null;
  traxsourceUrl: string | null;
  // SEO
  seoTitle: string | null;
  seoDescription: string | null;
  recordLabels: RecordLabel[];
  // REQ-10
  releases: ArtistRelease[];
  // REQ-11
  epsReleasedCount: number | null;
  externalCollabsCount: number | null;
  translations: ArtistTranslations;
  createdAt: string;
  updatedAt: string;
}

/** Payload accepted by PATCH /api/artists/:id. All fields optional. */
export interface UpdateArtistPayload {
  displayName?: string;
  bio?: string | null;
  fullBio?: string | null;
  baseLocale?: SupportedLocale;
  category?: ArtistCategory;
  secondaryCategories?: ArtistCategory[];
  tags?: string[];
  galleryImageUrls?: string[];
  instagramUrl?: string | null;
  tiktokUrl?: string | null;
  youtubeUrl?: string | null;
  spotifyUrl?: string | null;
  soundcloudUrl?: string | null;
  websiteUrl?: string | null;
  contactEmail?: string | null;
  appleMusicUrl?: string | null;
  amazonMusicUrl?: string | null;
  deezerUrl?: string | null;
  tidalUrl?: string | null;
  beatportUrl?: string | null;
  traxsourceUrl?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  recordLabels?: RecordLabel[];
  // REQ-10 + REQ-11
  releases?: ArtistRelease[];
  epsReleasedCount?: number | null;
  externalCollabsCount?: number | null;
  translations?: ArtistTranslations;
}

/**
 * Fetches an artist by ID from the backend.
 * Returns null on any error (network issue, 404, unauthorised, etc.).
 * Safe to call from server layouts — failures degrade gracefully.
 *
 * Cached for 60 s server-side via `unstable_cache`.
 * Access token is captured via closure and never enters the cache key,
 * so different session tokens still hit the same stable cache entry.
 * Invalidated by `revalidateTag(\`artist:\${artistId}\`)` in mutation handlers.
 */
export async function getArtist(artistId: string, accessToken: string): Promise<Artist | null> {
  return unstable_cache(
    async () => {
      try {
        const res = await apiFetch(`/api/artists/${artistId}`, { accessToken });
        if (!res.ok) return null;
        return res.json() as Promise<Artist>;
      } catch {
        return null;
      }
    },
    ['artist', artistId],
    { tags: [`artist:${artistId}`], revalidate: 60 },
  )();
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
