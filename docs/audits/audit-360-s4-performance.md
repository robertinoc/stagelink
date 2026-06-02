# Audit 360 — S4 Performance Audit

Date: 2026-06-02

Scope:

- T4.1 Audit Landing Performance
- T4.2 Audit Dashboard Performance
- T4.3 Audit Artist Page Performance
- T4.4 Audit Bundle & Assets

## Executive Summary

S4 builds on the May 2026 performance audit, which already shipped the largest wins: public-page
cover/gallery image optimization, dashboard cache and JS splitting, PostHog lazy-loading, and Stripe
catalog memoization. The remaining code-level gap with clear ROI was merch image delivery on public
artist pages.

Shopify and Smart Merch blocks still rendered provider thumbnails through raw `<img>` tags. That
kept product images outside Next/Vercel image optimization, preserved an existing lint warning, and
left public pages exposed to heavy provider originals. S4 moves those merch thumbnails to
`next/image` and expands the explicit external image host policy for merch CDNs.

## Findings Implemented

### S4-001 — Merch Thumbnails Bypassed Next Image Optimization

Area: T4.3 Artist Page Performance, T4.4 Bundle & Assets

The previous performance audit optimized cover, avatar, release, and gallery images, but merch blocks
were still using raw `<img>` elements:

- `ShopifyStoreRenderer`
- `SmartMerchRenderer`

Implemented:

- Migrated Shopify product thumbnails to `next/image` with stable dimensions, responsive `sizes`, and
  icon fallback on missing/failed image.
- Migrated Smart Merch product thumbnails to `next/image` for grid and list layouts, preserving the
  existing visual dimensions and fallback state.
- Removed local `@next/next/no-img-element` disables from both renderers.
- Added explicit remote image hosts for Shopify, Printful, and Printify provider assets in
  `apps/web/next.config.ts`.

### S4-002 — External Image Host Policy Needed to Match Product Reality

Area: T4.4 Bundle & Assets

`next.config.ts` already allowed release-cover hosts like Spotify, Beatport, and Google thumbnail
fallbacks. After S7/S1, public positioning and product gating now include Shopify and Smart Merch, so
the image optimization policy needed to include the provider CDNs that can appear on public artist
pages.

Implemented:

- Added `cdn.shopify.com` for Shopify Storefront product images.
- Added `files.cdn.printful.com` and `static.cdn.printful.com` for Printful thumbnails/mockups.
- Added `images-api.printify.com` so the allow-list is ready when the modeled Printify provider is
  enabled.
- Reworded the config comment to document the asset policy as release-link plus merch provider
  coverage.

## Audit Notes

### T4.1 Landing Performance

No landing code change was needed in S4. The landing page remains mostly copy, CSS, and local React
UI. The bigger landing risk is visual richness after S1 positioning: adding real screenshots or
motion previews later should be paired with image budget checks and responsive assets.

### T4.2 Dashboard Performance

No new dashboard implementation was shipped in S4. The prior audit already added cached hot reads,
dynamic settings tabs, and EPK editor lazy-loading. The next meaningful dashboard work should be
measured against real user navigation timing rather than speculative refactors.

### T4.3 Artist Page Performance

Merch thumbnails were the remaining public-page asset path that had not joined the `next/image`
pipeline. This matters because public artist pages can combine cover, avatar, releases, gallery,
Shopify blocks, and Smart Merch blocks in one scroll.

### T4.4 Bundle & Assets

S4 keeps the image policy explicit rather than wildcarding all remote images. That preserves a safer
optimization surface while letting known provider images use Vercel transcoding.

## Remaining Performance Backlog

- Add a small public-page fixture or e2e route that renders release, gallery, Shopify, and Smart
  Merch blocks together, then assert there are no Next image optimizer 400s.
- Source real RUM data through Vercel Speed Insights or Sentry before revisiting the Sentry lazy-load
  trade-off documented in `docs/perf-audit-2026-05.md`.
- If field data shows public-page TTFB/LCP pressure, revisit client-side or middleware page-view
  tracking so ISR can be enabled without breaking analytics accuracy.
- Add bundle/route artifact capture to CI once Turbopack analyzer output is stable enough to diff
  automatically.
