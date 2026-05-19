import { unstable_cache } from 'next/cache';
import { apiFetch } from '@/lib/auth';

export interface ArtistPage {
  id: string;
  artistId: string;
  title: string | null;
  isPublished: boolean;
  theme?: Record<string, string>;
  createdAt: string;
  updatedAt: string;
}

/**
 * PATCH /api/pages/:pageId
 * Updates mutable page fields (title, isPublished, theme).
 * Proxied through the Next.js web route handler to keep the access token server-side.
 */
export async function updatePage(
  pageId: string,
  data: { theme?: Record<string, string> },
): Promise<ArtistPage> {
  const res = await fetch(`/api/pages/${pageId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`Failed to update page: ${res.status}`);
  return res.json() as Promise<ArtistPage>;
}

/**
 * GET /api/pages/artist/:artistId
 * Returns all pages for an artist (currently 1:1 with artist).
 * Returns empty array on any error — callers degrade gracefully.
 *
 * Cached for 60 s server-side via `unstable_cache`.
 * Invalidated by `revalidateTag(\`pages:\${artistId}\`)` in mutation handlers.
 */
export async function getArtistPages(artistId: string, accessToken: string): Promise<ArtistPage[]> {
  return unstable_cache(
    async () => {
      try {
        const res = await apiFetch(`/api/pages/artist/${artistId}`, { accessToken });
        if (!res.ok) return [];
        return res.json() as Promise<ArtistPage[]>;
      } catch {
        return [];
      }
    },
    ['pages', artistId],
    { tags: [`pages:${artistId}`], revalidate: 60 },
  )();
}
