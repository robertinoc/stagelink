# Audit 360 — S9 SEO & Public Pages Audit

Date: 2026-06-01

Scope:

- T9.1 Audit SEO Landing
- T9.2 Audit SEO Artist Pages
- T9.3 Audit Social Sharing (OG tags)

## Executive Summary

S9 focused on the public indexable surface after S8 centralized locale alternates. The largest gaps
were not in copy quality, but in crawler and sharing signals: the sitemap only exposed the root URL,
placeholder marketing pages were indexable, public artist metadata depended on an optional env var
for canonical URLs, and there was no default social preview image for landing/marketing routes.

## Findings Implemented

### S9-001 — Sitemap Only Listed the Root URL

Area: T9.1 SEO Landing

The sitemap returned a single `https://stagelink.art` entry even though localized landing, pricing,
and install pages are the canonical public marketing URLs.

Implemented:

- Added localized sitemap entries for `/en`, `/es`, `/en/pricing`, `/es/pricing`, `/en/install`,
  and `/es/install`.
- Added `alternates.languages` with `en`, `es`, and `x-default` to each sitemap entry.
- Kept dynamic artist pages out of the sitemap until the backend exposes a paginated published-page
  listing endpoint.

### S9-002 — Placeholder Docs/Blog Pages Were Indexable

Area: T9.1 SEO Landing

The Docs and Blog pages are intentionally coming-soon shells. Keeping them indexable risks thin
content in search results.

Implemented:

- Added `robots: { index: false, follow: true }` to `/[locale]/docs`.
- Added `robots: { index: false, follow: true }` to `/[locale]/blog`.
- Omitted Docs/Blog from the static sitemap until real content exists.

### S9-003 — Public Artist/EPK Canonicals Depended on Optional Env

Area: T9.2 SEO Artist Pages

Public artist and EPK metadata only emitted canonical/alternate URLs when `NEXT_PUBLIC_APP_URL` was
set. In preview or misconfigured environments, that could silently produce `noindex` artist
metadata.

Implemented:

- Added a shared canonical app URL helper with production fallback.
- Updated public artist and public EPK metadata to always emit canonical URLs and localized
  alternates.
- Reused the helper in root metadata, robots, and sitemap generation.

### S9-004 — Landing/Marketing Lacked a Default Social Preview Image

Area: T9.3 Social Sharing (OG tags)

Root metadata requested large social cards, but there was no default Open Graph/Twitter image file
for landing and marketing pages that do not provide their own media.

Implemented:

- Added a generated `opengraph-image.tsx` for the app root.
- Added a matching `twitter-image.tsx` export so Twitter/X previews use the same branded image.

## Audit Notes

### T9.1 SEO Landing

Landing, pricing, and install now have localized sitemap coverage. Docs and Blog remain reachable
for users but are excluded from indexing while they are placeholders.

### T9.2 SEO Artist Pages

Artist and EPK pages now have stable canonical URLs with `en`, `es`, and `x-default` alternates.
Dynamic sitemap coverage for published artist pages remains blocked by the lack of a list endpoint.

### T9.3 Social Sharing

Public artist and EPK pages continue to prefer artist-provided cover/hero images. Marketing routes
now have a default branded OG/Twitter image fallback.

## Remaining SEO Backlog

- Add a backend endpoint for published public pages and include eligible artist/EPK pages in the
  sitemap with `lastModified`.
- Add per-artist OG image generation when an artist has no cover/hero image.
- Re-index Docs and Blog only after real long-form content exists.
- Add production smoke checks for rendered metadata tags on `/en`, `/es`, public artist pages, and
  public EPK pages.
