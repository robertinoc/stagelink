# Audit 360 — S8 Internationalization Audit

Date: 2026-05-28

Scope:

- T8.1 Audit EN/ES Consistency
- T8.2 Audit Missing Translations
- T8.3 Audit SEO Localization

## Executive Summary

S8 focused on the shared web i18n surface after S3/S7 changed dashboard and monetization flows.
The product message files were structurally healthy: `en.json` and `es.json` had the same key set.
The main gaps were content consistency around marketing placeholder pages and pricing, plus repeated
SEO locale metadata patterns that did not include an `x-default` fallback.

## Findings Implemented

### S8-001 — Pricing Page Mixed Localized and Hardcoded English Copy

Area: T8.1 EN/ES Consistency, T8.2 Missing Translations

The localized pricing page used translated plan names, prices, descriptions, and CTAs, but the plan
feature bullets and popular badge were still hardcoded in English. Spanish users therefore saw a
mixed-language pricing table.

Implemented:

- Added pricing feature keys and `popular_badge` to `messages/en.json` and `messages/es.json`.
- Updated `/[locale]/pricing` to render all visible plan copy through `next-intl`.
- Added localized pricing `description` metadata from the existing translated subtitle.

### S8-002 — Docs/Blog Placeholder Cards Were English-Only

Area: T8.1 EN/ES Consistency

The Docs and Blog coming-soon shells used localized headings and descriptions, but their placeholder
card labels/descriptions were defined as English constants inside the route files.

Implemented:

- Moved Docs and Blog placeholder card content into the landing translation dictionary.
- Updated `/[locale]/docs` and `/[locale]/blog` to render locale-specific placeholder items.

### S8-003 — Localized SEO Alternates Were Duplicated and Missing x-default

Area: T8.3 SEO Localization

Localized public/marketing pages manually repeated `en` and `es` alternates. They did not expose an
`x-default` alternate, and Open Graph locale tags were not centralized.

Implemented:

- Added `seo-localization` helpers for localized alternates, `x-default`, and Open Graph locale
  tags.
- Applied the helper to the landing page, pricing, docs, blog, install, public artist pages, and
  public EPK pages.
- Added unit coverage for localized alternate generation and Open Graph locale mapping.

## Audit Notes

### T8.1 EN/ES Consistency

`messages/en.json` and `messages/es.json` now have 1898 leaf keys each, with no missing or extra
keys. Remaining identical strings are mostly product names, platform names, technical labels, or
intentionally bilingual industry terms such as EPK, Press Kit, Analytics, Smart Merch, and Spotify.

### T8.2 Missing Translations

No structural key gaps remain in the primary `next-intl` message files. The landing translation
dictionary is typed, so future Docs/Blog placeholder content must provide both EN and ES values.

### T8.3 SEO Localization

Localized route metadata now emits `en`, `es`, and `x-default` alternates through one helper. Public
artist and EPK Open Graph metadata also use normalized locale tags (`en_US`, `es_AR`) plus alternate
locale tags.

## Remaining I18n Backlog

- Review legal/privacy Spanish copy after final legal text is approved.
- Decide whether terms like Press Kit, EPK, Analytics, Smart Merch, and Billing should remain
  bilingual product language or receive stricter Spanish alternatives.
- Add visual regression coverage for the longest Spanish marketing and dashboard strings.
