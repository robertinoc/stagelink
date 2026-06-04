/**
 * Builds the absolute URL for the dynamic per-artist Open Graph image.
 *
 * Used as the social preview for artists that have neither a cover nor an avatar
 * image, so their shared links still render a branded card with their name
 * instead of falling back to no image.
 *
 * The values are truncated to keep the rendered card readable and to bound the
 * query string. The image route re-validates/truncates on its side too.
 */
const MAX_NAME = 60;
const MAX_HANDLE = 40;
const FALLBACK_ORIGIN = 'https://stagelink.art';

export const OG_ARTIST_LIMITS = { name: MAX_NAME, handle: MAX_HANDLE } as const;

export function buildArtistOgImageUrl(
  origin: string,
  displayName: string,
  username: string,
): string {
  const base = origin.replace(/\/$/, '') || FALLBACK_ORIGIN;
  const url = new URL('/api/og/artist', base);
  url.searchParams.set('name', displayName.slice(0, MAX_NAME));
  url.searchParams.set('handle', username.slice(0, MAX_HANDLE));
  return url.toString();
}
