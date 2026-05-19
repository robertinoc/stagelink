// profileCompletion.ts — pure function, no React deps.
// Computes per-tab and total completion percentages from the form values.

import type { ProfileFormValues } from '../schemas/profile.schema';

export interface TabCompletion {
  identity: number;
  social: number;
  catalog: number;
  seo: number;
  total: number;
}

function pct(filled: number, total: number) {
  if (total === 0) return 100;
  return Math.round((filled / total) * 100);
}

function filled(v: unknown): boolean {
  if (v === null || v === undefined) return false;
  if (typeof v === 'string') return v.trim().length > 0;
  if (typeof v === 'number') return true;
  if (Array.isArray(v)) return v.length > 0;
  return Boolean(v);
}

export function computeCompletion(values: ProfileFormValues): TabCompletion {
  // ── Tab 1: Identidad y galería ─────────────────────────────────────────
  // Cover (galleryImageUrls item 0 is used as cover indicator in form — artist.coverImageUrl
  // is separate but tracked via the artist object, not form values. Treat as bonus.)
  const identityItems = [
    filled(values.displayName), // artist name
    filled(values.bio), // bio corta
    filled(values.fullBio), // bio completa
    values.categories.length > 0, // at least 1 category
    values.tags.length > 0, // at least 1 descriptor
    values.galleryImageUrls.length > 0, // gallery has ≥1 photo
  ];
  const identity = pct(identityItems.filter(Boolean).length, identityItems.length);

  // ── Tab 2: Redes y música ──────────────────────────────────────────────
  // 14 platforms — 1 point each; no "required" platforms
  const socialKeys = [
    values.instagramUrl,
    values.tiktokUrl,
    values.youtubeUrl,
    // twitter/x not currently in schema — skip
    values.spotifyUrl,
    values.appleMusicUrl,
    values.soundcloudUrl,
    values.amazonMusicUrl,
    values.deezerUrl,
    values.tidalUrl,
    values.beatportUrl,
    values.traxsourceUrl,
    values.websiteUrl,
    values.contactEmail,
  ];
  const filledSocials = socialKeys.filter(filled).length;
  // Require at least 3 to consider this "started"; otherwise low numbers
  // map to very low %. Cap denominator at 8 to avoid punishing niche artists.
  const social = pct(Math.min(filledSocials, 8), 8);

  // ── Tab 3: Catálogo ───────────────────────────────────────────────────
  const catalogItems = [
    values.recordLabels.length > 0, // at least 1 label
    values.releases.length > 0, // at least 1 release
    values.epsReleasedCount !== null, // counter set
    values.externalCollabsCount !== null, // counter set
  ];
  const catalog = pct(catalogItems.filter(Boolean).length, catalogItems.length);

  // ── Tab 4: SEO & idiomas ──────────────────────────────────────────────
  const seoItems = [
    filled(values.seoTitle),
    filled(values.seoDescription),
    // Bonus: at least one translation field filled
    Object.values(values.translations.en).some((v) => v && v.trim()) ||
      Object.values(values.translations.es).some((v) => v && v.trim()),
  ];
  const seo = pct(seoItems.filter(Boolean).length, seoItems.length);

  // ── Global (weighted average) ─────────────────────────────────────────
  // Weights: identity 40%, social 25%, catalog 20%, seo 15%
  const total = Math.round(identity * 0.4 + social * 0.25 + catalog * 0.2 + seo * 0.15);

  return { identity, social, catalog, seo, total };
}
