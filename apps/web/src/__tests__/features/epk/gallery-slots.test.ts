import { describe, it, expect } from 'vitest';
import {
  resolveGallerySlots,
  applyGalleryImageAt,
  resolveDisplayedArtistImage,
} from '@/features/epk/utils/gallery-slots';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const HERO = 'https://cdn.stagelink.art/hero.jpg';
const PORTRAIT = 'https://cdn.stagelink.art/portrait.jpg';
const AVATAR = 'https://cdn.stagelink.art/avatar.jpg';
const COVER = 'https://cdn.stagelink.art/cover.jpg';
const EXTRA1 = 'https://cdn.stagelink.art/extra1.jpg';
const EXTRA2 = 'https://cdn.stagelink.art/extra2.jpg';

// ---------------------------------------------------------------------------
// resolveGallerySlots
// ---------------------------------------------------------------------------

describe('resolveGallerySlots', () => {
  // ── Normal / healthy cases ─────────────────────────────────────────────────

  it('returns an already well-structured array unchanged (both slots populated + extras)', () => {
    const input = [HERO, PORTRAIT, EXTRA1, EXTRA2];
    const result = resolveGallerySlots(input, HERO, AVATAR, COVER);
    expect(result[0]).toBe(HERO);
    expect(result[1]).toBe(PORTRAIT);
    expect(result[2]).toBe(EXTRA1);
    expect(result[3]).toBe(EXTRA2);
  });

  it('populates empty slot 0 from heroImageUrl when slot 0 is missing', () => {
    const result = resolveGallerySlots([], HERO, AVATAR, COVER);
    expect(result[0]).toBe(HERO);
  });

  it('populates slot 0 from cover when no hero', () => {
    const result = resolveGallerySlots([], null, AVATAR, COVER);
    expect(result[0]).toBe(COVER);
  });

  it('populates slot 0 from avatar as last resort when no hero/cover', () => {
    const result = resolveGallerySlots([], null, AVATAR, null);
    expect(result[0]).toBe(AVATAR);
  });

  it('populates empty slot 1 from avatar', () => {
    const result = resolveGallerySlots([HERO], HERO, AVATAR, COVER);
    // slot 0 stays, slot 1 gets avatar
    expect(result[0]).toBe(HERO);
    expect(result[1]).toBe(AVATAR);
  });

  it('does not add slot 1 when avatar is also empty', () => {
    const result = resolveGallerySlots([HERO], HERO, null, null);
    // slot 0 stays, no slot 1 added (filtered out)
    expect(result[0]).toBe(HERO);
    expect(result[1]).toBeUndefined();
  });

  // ── Compaction recovery ────────────────────────────────────────────────────
  // This is the main bug: the old filter(Boolean) collapsed portrait from
  // slot 1 to slot 0 when slot 0 was empty. The resulting DB state has
  // raw[0] = portrait (≠ hero) and raw[1] = undefined/missing.

  it('recovers a compacted portrait (slot 0 ≠ hero, slot 1 empty) back to slot 1', () => {
    // DB stored portrait in slot 0 due to the old bug
    const raw = [PORTRAIT]; // portrait was compacted to slot 0
    const result = resolveGallerySlots(raw, HERO, AVATAR, COVER);
    // Recovery: slot 0 should be cover mirror, slot 1 should be portrait
    expect(result[0]).toBe(HERO); // hero takes precedence for slot 0
    expect(result[1]).toBe(PORTRAIT);
  });

  it('recovery uses cover when no hero is set', () => {
    const raw = [PORTRAIT];
    const result = resolveGallerySlots(raw, null, AVATAR, COVER);
    expect(result[0]).toBe(COVER);
    expect(result[1]).toBe(PORTRAIT);
  });

  it('recovery uses avatar as slot 0 when neither hero nor cover is available', () => {
    const raw = [PORTRAIT];
    const result = resolveGallerySlots(raw, null, AVATAR, null);
    expect(result[0]).toBe(AVATAR);
    expect(result[1]).toBe(PORTRAIT);
  });

  it('does NOT trigger recovery when slot 0 equals heroImageUrl (not a compacted portrait)', () => {
    // Slot 0 IS the hero cover (normal state) — do not misidentify as compacted
    const raw = [HERO]; // slot 0 = hero, slot 1 missing
    const result = resolveGallerySlots(raw, HERO, AVATAR, COVER);
    expect(result[0]).toBe(HERO);
    // slot 1 should be populated from avatar, not from a compaction recovery
    expect(result[1]).toBe(AVATAR);
  });

  it('does NOT trigger recovery when slot 1 is already populated', () => {
    const raw = [PORTRAIT, PORTRAIT]; // both slots have same URL — weird but valid, no recovery
    const result = resolveGallerySlots(raw, HERO, AVATAR, COVER);
    expect(result[0]).toBe(PORTRAIT); // left as-is (slot 1 is present, no recovery triggered)
    expect(result[1]).toBe(PORTRAIT);
  });

  it('portrait-only compaction: recovery restores slot structure and has no extras', () => {
    // Most common real-world compacted state: user uploaded portrait, no extra photos.
    // DB stored: [PORTRAIT] — portrait compacted from slot 1 to slot 0.
    const result = resolveGallerySlots([PORTRAIT], HERO, AVATAR, COVER);
    expect(result[0]).toBe(HERO);
    expect(result[1]).toBe(PORTRAIT);
    expect(result[2]).toBeUndefined(); // no extras
  });

  it('recovery with extras: recovery only fires when slot 1 is empty', () => {
    // If extras were also present when the bug fired, the DB would contain
    // [PORTRAIT, EXTRA1, EXTRA2] (portrait at slot 0, extras shifted left).
    // In this state raw[1] = EXTRA1 (truthy) so recovery does NOT trigger —
    // we cannot safely distinguish "compacted portrait + extras" from
    // "someone legitimately saved a non-hero URL at slot 0".
    // This is a documented edge case limitation of the simple recovery heuristic.
    const raw = [PORTRAIT, EXTRA1, EXTRA2];
    const result = resolveGallerySlots(raw, HERO, AVATAR, COVER);
    // No recovery: raw[1] = EXTRA1 is truthy
    expect(result[0]).toBe(PORTRAIT); // left as-is
    expect(result[1]).toBe(EXTRA1);
    expect(result[2]).toBe(EXTRA2);
  });

  it('filters out empty strings from the result', () => {
    const result = resolveGallerySlots(['', '', ''], null, null, null);
    expect(result).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// applyGalleryImageAt
// ---------------------------------------------------------------------------

describe('applyGalleryImageAt', () => {
  // ── Setting slot 0 (cover mirror) ─────────────────────────────────────────

  it('sets slot 0 directly', () => {
    const result = applyGalleryImageAt([], 0, HERO, HERO, COVER, AVATAR);
    expect(result[0]).toBe(HERO);
  });

  // ── Setting slot 1 (portrait) ──────────────────────────────────────────────

  it('sets slot 1 without compaction when slot 0 is already populated', () => {
    const gallery = [HERO];
    const result = applyGalleryImageAt(gallery, 1, PORTRAIT, HERO, COVER, AVATAR);
    expect(result[0]).toBe(HERO);
    expect(result[1]).toBe(PORTRAIT);
  });

  it('pads slot 0 with heroImageUrl before setting portrait so filter(Boolean) does not compact', () => {
    // Critical: gallery is empty — without the fix, filter(Boolean) on [undefined, PORTRAIT]
    // would produce [PORTRAIT] (compacted to slot 0)
    const gallery: string[] = [];
    const result = applyGalleryImageAt(gallery, 1, PORTRAIT, HERO, COVER, AVATAR);
    expect(result[0]).toBe(HERO); // padded slot 0
    expect(result[1]).toBe(PORTRAIT); // portrait in correct slot
  });

  it('pads slot 0 with cover when no heroImageUrl is available', () => {
    const result = applyGalleryImageAt([], 1, PORTRAIT, null, COVER, AVATAR);
    expect(result[0]).toBe(COVER);
    expect(result[1]).toBe(PORTRAIT);
  });

  it('pads slot 0 with avatar when neither hero nor cover is available', () => {
    const result = applyGalleryImageAt([], 1, PORTRAIT, null, null, AVATAR);
    expect(result[0]).toBe(AVATAR);
    expect(result[1]).toBe(PORTRAIT);
  });

  it('does NOT pad slot 0 when no fallback is available at all (no compaction possible anyway)', () => {
    const result = applyGalleryImageAt([], 1, PORTRAIT, null, null, null);
    // No fallback — slot 0 stays empty, portrait ends up at slot 0 after filter
    // This is acceptable: without a cover/avatar there's nothing to use as slot 0
    expect(result[0]).toBe(PORTRAIT);
  });

  // ── Setting slot 2+ (extra photos) ────────────────────────────────────────

  it('pads slot 0 when setting an extra gallery photo (index 2) into an empty gallery', () => {
    const result = applyGalleryImageAt([], 2, EXTRA1, HERO, COVER, AVATAR);
    expect(result[0]).toBe(HERO); // padded
    // slot 2 gets the photo — exact position after filter depends on what was set
    expect(result).toContain(EXTRA1);
  });

  it('preserves existing extra photos when updating slot 1', () => {
    const gallery = [HERO, PORTRAIT, EXTRA1, EXTRA2];
    const newPortrait = 'https://cdn.stagelink.art/portrait-new.jpg';
    const result = applyGalleryImageAt(gallery, 1, newPortrait, HERO, COVER, AVATAR);
    expect(result[0]).toBe(HERO);
    expect(result[1]).toBe(newPortrait);
    expect(result[2]).toBe(EXTRA1);
    expect(result[3]).toBe(EXTRA2);
  });
});

// ---------------------------------------------------------------------------
// resolveDisplayedArtistImage
// ---------------------------------------------------------------------------

describe('resolveDisplayedArtistImage', () => {
  it('prefers slot 1 when available', () => {
    const result = resolveDisplayedArtistImage([HERO, PORTRAIT], HERO, AVATAR);
    expect(result).toBe(PORTRAIT);
  });

  it('falls back to slot 0 when it looks like a compacted portrait (slot 0 ≠ hero)', () => {
    // Compaction recovery in display: slot 0 has portrait URL (≠ hero), slot 1 missing
    const result = resolveDisplayedArtistImage([PORTRAIT], HERO, AVATAR);
    expect(result).toBe(PORTRAIT);
  });

  it('does NOT use slot 0 when it equals heroImageUrl (that is the cover, not the portrait)', () => {
    const result = resolveDisplayedArtistImage([HERO], HERO, AVATAR);
    expect(result).toBe(AVATAR); // falls through to avatar
  });

  it('falls back to inherited avatar when no portrait in gallery', () => {
    const result = resolveDisplayedArtistImage([], HERO, AVATAR);
    expect(result).toBe(AVATAR);
  });

  it('returns empty string when no portrait at all', () => {
    const result = resolveDisplayedArtistImage([], HERO, null);
    expect(result).toBe('');
  });

  it('returns slot 1 even when avatar is null', () => {
    const result = resolveDisplayedArtistImage([HERO, PORTRAIT], HERO, null);
    expect(result).toBe(PORTRAIT);
  });
});
