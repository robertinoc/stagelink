/**
 * page-translation.ts
 *
 * Extracts translatable text strings from a PublicPageResponse into a flat
 * Record<string, string>, and applies a translations map back to produce a
 * new PublicPageResponse with translated content.
 *
 * Used by the client-side auto-translate toggle in ArtistPageView:
 *   const translatable = extractTranslatablePageContent(page);
 *   const translated = await autoTranslateLocalizedFields({ values: translatable, … });
 *   const translatedPage = applyTranslationsToPage(page, translated);
 *
 * Fields that are intentionally NOT translated:
 *   - URLs, emails, usernames, handles
 *   - artist.displayName (proper name — transliteration would break it)
 *   - artist.tags (short genre labels managed by the artist)
 *   - Blocks with htmlMode=true (raw embed codes)
 *   - Blocks with bioSource (content is proxied from the profile, already handled via artist.bio/fullBio)
 *   - music_embed / video_embed / image_gallery / releases / record_labels / public_counters / technical_rider / contact_form blocks
 */

import type { PublicPageResponse, PublicBlock, BlockConfig } from '@stagelink/types';

// ── Extraction ────────────────────────────────────────────────────────────────

/**
 * Build a flat key→value map of all user-authored text that can be
 * translated. Pass this as `values` to `autoTranslateLocalizedFields`.
 */
export function extractTranslatablePageContent(page: PublicPageResponse): Record<string, string> {
  const result: Record<string, string> = {};

  if (page.artist.bio) result['artist.bio'] = page.artist.bio;
  if (page.artist.fullBio) result['artist.fullBio'] = page.artist.fullBio;

  for (const block of page.blocks) {
    if (block.title) result[`block.${block.id}.title`] = block.title;
    extractBlockFields(block, result);
  }

  return result;
}

function extractBlockFields(block: PublicBlock, out: Record<string, string>): void {
  const { id, type } = block;
  const cfg = block.config as Record<string, unknown>;

  switch (type) {
    case 'text': {
      const body = cfg.body as string | undefined;
      const htmlMode = cfg.htmlMode as boolean | undefined;
      const bioSource = cfg.bioSource as string | undefined;
      if (body && !htmlMode && !bioSource) {
        out[`block.${id}.body`] = body;
      }
      break;
    }
    case 'links': {
      const items = (cfg.items as Array<{ id: string; label: string }> | undefined) ?? [];
      for (const item of items) {
        if (item.label) out[`block.${id}.item.${item.id}.label`] = item.label;
      }
      break;
    }
    case 'email_capture': {
      addIfString(out, `block.${id}.headline`, cfg.headline);
      addIfString(out, `block.${id}.description`, cfg.description);
      addIfString(out, `block.${id}.buttonLabel`, cfg.buttonLabel);
      addIfString(out, `block.${id}.placeholder`, cfg.placeholder);
      addIfString(out, `block.${id}.successMessage`, cfg.successMessage);
      addIfString(out, `block.${id}.consentLabel`, cfg.consentLabel);
      break;
    }
    case 'shopify_store': {
      addIfString(out, `block.${id}.headline`, cfg.headline);
      addIfString(out, `block.${id}.description`, cfg.description);
      addIfString(out, `block.${id}.ctaLabel`, cfg.ctaLabel);
      break;
    }
    case 'smart_merch': {
      addIfString(out, `block.${id}.headline`, cfg.headline);
      addIfString(out, `block.${id}.subtitle`, cfg.subtitle);
      addIfString(out, `block.${id}.ctaLabel`, cfg.ctaLabel);
      break;
    }
    // music_embed, video_embed, image_gallery, releases, record_labels,
    // public_counters, technical_rider, contact_form — no user text to translate
  }
}

function addIfString(out: Record<string, string>, key: string, value: unknown): void {
  if (typeof value === 'string' && value.trim()) out[key] = value;
}

// ── Application ───────────────────────────────────────────────────────────────

/**
 * Apply a translations map (returned by `autoTranslateLocalizedFields`) back
 * to a PublicPageResponse. Returns a new object — the original is not mutated.
 */
export function applyTranslationsToPage(
  page: PublicPageResponse,
  translations: Record<string, string>,
): PublicPageResponse {
  return {
    ...page,
    artist: {
      ...page.artist,
      bio: translations['artist.bio'] ?? page.artist.bio,
      fullBio: translations['artist.fullBio'] ?? page.artist.fullBio,
    },
    blocks: page.blocks.map((block) => applyBlockTranslations(block, translations)),
  };
}

function applyBlockTranslations(block: PublicBlock, tr: Record<string, string>): PublicBlock {
  const { id, type } = block;
  const cfg = block.config as Record<string, unknown>;

  const translatedTitle = tr[`block.${id}.title`] ?? block.title;
  let translatedConfig: Record<string, unknown> = cfg;

  switch (type) {
    case 'text': {
      const htmlMode = cfg.htmlMode as boolean | undefined;
      const bioSource = cfg.bioSource as string | undefined;
      if (tr[`block.${id}.body`] && !htmlMode && !bioSource) {
        translatedConfig = { ...cfg, body: tr[`block.${id}.body`] };
      }
      break;
    }
    case 'links': {
      const items = (cfg.items as Array<{ id: string; label: string; [k: string]: unknown }>) ?? [];
      const anyUpdated = items.some(
        (item) => tr[`block.${id}.item.${item.id}.label`] !== undefined,
      );
      if (anyUpdated) {
        translatedConfig = {
          ...cfg,
          items: items.map((item) => ({
            ...item,
            label: tr[`block.${id}.item.${item.id}.label`] ?? item.label,
          })),
        };
      }
      break;
    }
    case 'email_capture': {
      translatedConfig = {
        ...cfg,
        ...(tr[`block.${id}.headline`] && { headline: tr[`block.${id}.headline`] }),
        ...(tr[`block.${id}.description`] && { description: tr[`block.${id}.description`] }),
        ...(tr[`block.${id}.buttonLabel`] && { buttonLabel: tr[`block.${id}.buttonLabel`] }),
        ...(tr[`block.${id}.placeholder`] && { placeholder: tr[`block.${id}.placeholder`] }),
        ...(tr[`block.${id}.successMessage`] && {
          successMessage: tr[`block.${id}.successMessage`],
        }),
        ...(tr[`block.${id}.consentLabel`] && { consentLabel: tr[`block.${id}.consentLabel`] }),
      };
      break;
    }
    case 'shopify_store': {
      translatedConfig = {
        ...cfg,
        ...(tr[`block.${id}.headline`] && { headline: tr[`block.${id}.headline`] }),
        ...(tr[`block.${id}.description`] && { description: tr[`block.${id}.description`] }),
        ...(tr[`block.${id}.ctaLabel`] && { ctaLabel: tr[`block.${id}.ctaLabel`] }),
      };
      break;
    }
    case 'smart_merch': {
      translatedConfig = {
        ...cfg,
        ...(tr[`block.${id}.headline`] && { headline: tr[`block.${id}.headline`] }),
        ...(tr[`block.${id}.subtitle`] && { subtitle: tr[`block.${id}.subtitle`] }),
        ...(tr[`block.${id}.ctaLabel`] && { ctaLabel: tr[`block.${id}.ctaLabel`] }),
      };
      break;
    }
  }

  return {
    ...block,
    title: translatedTitle,
    config: translatedConfig as BlockConfig,
  };
}
