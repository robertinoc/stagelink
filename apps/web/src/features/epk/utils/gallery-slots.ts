/**
 * EPK gallery slot utilities — pure functions with no React dependency.
 *
 * Slot conventions (index):
 *   0  — cover mirror  (matches heroImageUrl, or falls back to profile cover/avatar)
 *   1  — artist portrait (EPK-specific photo shown in templates)
 *   2+ — extra gallery photos displayed in the gallery section
 *
 * Bug history: prior to the fix, `applyGalleryImageAt(1, url)` called
 * `.filter(Boolean)` on an array where slot 0 was still empty, which
 * compacted the portrait from index 1 down to index 0. The public EPK
 * templates also read `artist.avatarUrl` instead of `galleryImageUrls[1]`,
 * so the portrait never actually showed up. Both issues are fixed here.
 */

/**
 * Normalise raw `galleryImageUrls` from the DB into the expected 2-slot
 * structure. Call this when initialising or resetting form state.
 *
 * @param raw         Raw array from DB / API response
 * @param heroImageUrl Current heroImageUrl (the cover photo)
 * @param avatarUrl   Inherited profile avatar
 * @param coverUrl    Inherited profile cover image
 */
export function resolveGallerySlots(
  raw: string[],
  heroImageUrl: string | null | undefined,
  avatarUrl: string | null | undefined,
  coverUrl: string | null | undefined,
): string[] {
  const arr = [...raw];
  const hero = heroImageUrl || null;
  const cover = hero || coverUrl || null;

  // Recovery: if slot 0 has a URL that differs from heroImageUrl AND slot 1 is
  // empty, the portrait was compacted from slot 1 to slot 0 by the old
  // filter(Boolean) bug in applyGalleryImageAt. Restore the correct structure.
  if (arr.length >= 1 && arr[0] && arr[0] !== hero && !arr[1]) {
    const portrait = arr[0];
    const slot0 = cover || avatarUrl || portrait;
    return [slot0, portrait, ...arr.slice(1)].filter(Boolean) as string[];
  }

  // Ensure both system slots are always populated so filter(Boolean) in
  // applyGalleryImageAt never collapses portrait from slot 1 to slot 0.
  if (!arr[0]) arr[0] = cover || avatarUrl || '';
  if (!arr[1]) arr[1] = avatarUrl || '';
  return arr.filter(Boolean) as string[];
}

/**
 * Return a copy of the gallery array with the given slot set to `url`,
 * while ensuring slot 0 (cover mirror) is always populated before filtering,
 * so portrait in slot 1 never gets compacted to slot 0.
 *
 * @param gallery     Current gallery array (from form state)
 * @param index       Target slot index
 * @param url         New URL value for that slot
 * @param heroImageUrl Current heroImageUrl (used as slot 0 fallback)
 * @param coverUrl    Inherited profile cover
 * @param avatarUrl   Inherited profile avatar
 */
export function applyGalleryImageAt(
  gallery: string[],
  index: number,
  url: string,
  heroImageUrl: string | null | undefined,
  coverUrl: string | null | undefined,
  avatarUrl: string | null | undefined,
): string[] {
  const next = [...gallery];
  // When setting slot 1 or higher, ensure slot 0 is populated so that
  // the subsequent filter(Boolean) doesn't collapse portrait → slot 0.
  if (index >= 1 && !next[0]) {
    const fallback = heroImageUrl || coverUrl || avatarUrl;
    if (fallback) next[0] = fallback;
  }
  next[index] = url;
  return next.filter(Boolean) as string[];
}

/**
 * Resolve the portrait URL to display in the EPK editor header.
 * Slot 1 is the EPK-specific portrait. If only slot 0 exists and it looks
 * like a compacted portrait (differs from the current hero cover), use that.
 * Fall back to the inherited profile avatar.
 */
export function resolveDisplayedArtistImage(
  gallery: string[],
  heroImageUrl: string | null | undefined,
  avatarUrl: string | null | undefined,
): string {
  return (
    gallery[1] || (gallery[0] && gallery[0] !== heroImageUrl ? gallery[0] : '') || avatarUrl || ''
  );
}
