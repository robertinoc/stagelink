import { apiFetch } from '@/lib/auth';

export interface ArtistPage {
  id: string;
  artistId: string;
  title: string | null;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * GET /api/pages/artist/:artistId
 * Returns all pages for an artist (currently 1:1 with artist).
 * Returns null on any error — callers degrade gracefully.
 */
export async function getArtistPages(artistId: string, accessToken: string): Promise<ArtistPage[]> {
  try {
    const res = await apiFetch(`/api/pages/artist/${artistId}`, { accessToken });
    if (!res.ok) return [];
    return res.json() as Promise<ArtistPage[]>;
  } catch {
    return [];
  }
}
