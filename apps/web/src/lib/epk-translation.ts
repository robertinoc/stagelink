/**
 * epk-translation.ts
 *
 * Extracts translatable text strings from a PublicEpkResponse into a flat
 * Record<string, string>, and applies a translations map back to produce a
 * new PublicEpkResponse with translated content.
 *
 * Used by the client-side auto-translate toggle in EPK templates.
 */

import type { PublicEpkResponse } from '@stagelink/types';

const TEXT_FIELDS = [
  'headline',
  'shortBio',
  'fullBio',
  'pressQuote',
  'riderInfo',
  'techRequirements',
  'availabilityNotes',
] as const;

type TranslatableEpkField = (typeof TEXT_FIELDS)[number];

// ── Extraction ────────────────────────────────────────────────────────────────

/**
 * Build a flat key→value map of all user-authored EPK text.
 * Pass as `values` to `autoTranslateLocalizedFields`.
 */
export function extractTranslatableEpkContent(epk: PublicEpkResponse): Record<string, string> {
  const result: Record<string, string> = {};

  for (const field of TEXT_FIELDS) {
    const value = epk[field];
    if (typeof value === 'string' && value.trim()) result[field] = value;
  }

  // Highlights — short bullet points
  epk.highlights.forEach((h, i) => {
    if (h.trim()) result[`highlight.${i}`] = h;
  });

  return result;
}

// ── Application ───────────────────────────────────────────────────────────────

/**
 * Apply a translations map back to a PublicEpkResponse.
 * Returns a new object — the original is not mutated.
 */
export function applyTranslationsToEpk(
  epk: PublicEpkResponse,
  translations: Record<string, string>,
): PublicEpkResponse {
  const updated: Partial<Record<TranslatableEpkField, string | null>> = {};
  for (const field of TEXT_FIELDS) {
    if (translations[field] !== undefined) updated[field] = translations[field];
  }

  return {
    ...epk,
    ...updated,
    highlights: epk.highlights.map((h, i) => translations[`highlight.${i}`] ?? h),
  };
}
