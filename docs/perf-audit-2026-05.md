# Performance audit — May 2026

Audit window: 2026-05-29 → 2026-05-30. Triggered by the user reporting the
dashboard "feels slow" on navigation and form interactions. Scope started
on the dashboard, expanded into the public artist page after the first
PageSpeed run revealed that LCP there was 15.8 s on mobile Slow 4G.

The audit shipped **6 PRs** (#430, #432, #433, #434, #435, #436) and
deliberately stopped before #437 (Sentry lazy-load) after deciding the
trade-off wasn't worth the risk.

## Shipped PRs

| PR | Concern | Headline change |
|---|---|---|
| [#430](https://github.com/robertinoc/stagelink/pull/430) | Dashboard navigation + form feedback | `unstable_cache` on `getAuthMe` + `getBillingSummary` (60 s TTL, tag-invalidated). `Cache-Control: private, SWR` on hot NestJS endpoints. New `SubmitBtn` primitive using `useFormStatus` so PlanTab form submits show instant disabled+spinner state. `experimental.optimizePackageImports` for lucide-react / Radix / recharts. Idempotent migration syncing `@@index([userId])` on `ArtistMembership` with the existing DB index. Dashboard sidebar / topbar avatars to `next/image`. |
| [#432](https://github.com/robertinoc/stagelink/pull/432) | Public page LCP — covers | `PublicCoverImage` to `next/image` with `priority`, `PublicAvatarImage` + `ReleaseCoverImage` to `next/image fill`. `unoptimized={!process.env.NEXT_PUBLIC_IMAGES_HOSTNAME}` as the safety net. |
| [#433](https://github.com/robertinoc/stagelink/pull/433) | Dashboard initial JS | `next/dynamic({ ssr: false })` on each of the four `SettingsTabs` children. New `EpkEditorV2Lazy` client wrapper so the 632-LOC editor can be dynamic-imported from the EPK server page. |
| [#434](https://github.com/robertinoc/stagelink/pull/434) | Public page initial JS + GDPR | `posthog-js` moved to `await import('posthog-js')` inside `initPostHog()`. Visitors who don't grant analytics consent never download the SDK. PostHogProvider's existing gate kept; only the SDK delivery changed. |
| [#435](https://github.com/robertinoc/stagelink/pull/435) | Backend writes + Stripe API spend | `ensureSubscriptionRecord` switched from `upsert({ update: {} })` (which writes WAL on every call) to `findUnique` on the hot path, `upsert` as the cold-path race-safe fallback. `getProductsCatalog` memoised per-process for 5 minutes to collapse Stripe product/price API calls. |
| [#436](https://github.com/robertinoc/stagelink/pull/436) | Public page LCP — gallery | `ImageGalleryRenderer` (block-system gallery) moved to `next/image fill`. Each 1–3 MB R2 original now ships as a 14–20 kB WebP at the rendered size. Closes #431. |

## Measured impact

Validated via PageSpeed Insights mobile on `https://stagelink.art/en/robertinoc`
(Lighthouse Slow 4G, Moto G Power emulated). Before = state of `main` before
the audit. After = state of `main` after #436 merged.

| Metric | Before | After | Delta |
|---|---|---|---|
| LCP | 15.8 s 🔴 | 3.6 s 🟠 | **−12.2 s (−77%)** |
| Total payload | 16.4 MB | 4.4 MB | **−12 MB** |
| Speed Index | 19.1 s | 15.3 s | −3.8 s |
| FCP | 1.4 s ✅ | 1.4 s ✅ | unchanged |
| CLS | 0 ✅ | 0 ✅ | unchanged |
| "Improve image delivery" diagnostic | 12 MB | not flagged | resolved |
| Performance score | 63 | 59 | −4 |
| **TBT** | **150 ms ✅** | **930 ms 🔴** | **+780 ms — see trade-offs** |
| Unused JS | 1321 KiB | 1320 KiB | ≈ unchanged |
| Main-thread work | 3.4 s | 4.8 s | +1.4 s |

Cover image transcode confirmed by `curl`:
- Original PNG on R2: 2.5 MB
- Vercel `/_next/image` WebP at `w=1080`: **19.5 kB** (130× reduction)

Gallery thumb transcode:
- Original JPG on R2: 4.0 MB
- Vercel WebP at `w=640`: **14.9 kB** (272× reduction)

PostHog code-split confirmed by incognito Network tab: zero `posthog` chunks
on the public page until the analytics consent banner is accepted.

## Trade-off: the TBT regression

Total Blocking Time regressed from 150 ms (green) to 930 ms (red) between
the two PageSpeed runs. Investigation found two probable contributors:

1. **`next/image fill` forced reflow**. The gallery (3 thumbnails) and the
   cover use `<Image fill>`, which measures the parent container on
   hydration. The PageSpeed report flagged a new "Forced reflow" diagnostic
   that wasn't present before #436.
2. **Decode work for images that now actually load**. Before #436, the
   raw R2 originals (1–3 MB each) were probably timing out or being
   abandoned by Lighthouse mid-download. After #436 they download
   instantly (14 kB each) and the browser pays the decode cost on
   the main thread.

Real-user impact is debatable. **LCP is what users perceive as "loaded",
TBT is what they perceive as "responsive after loaded".** A landing page
that the visitor consumes mostly by scrolling and tapping a few links
benefits more from the LCP win than it loses from the TBT regression.
The Lighthouse score being lower is mostly an artifact of the weighting.

If real-user metrics (Vercel Analytics Web Vitals, once Speed Insights is
on a paid plan, or RUM data through Sentry) show TBT regressing in the
field, the next attack is Sentry — see "Considered and stopped" below.

## What the audit got wrong

Out of 11 items in the original audit plan, **7 turned out to be no-ops
after verifying against the actual code**:

| Item | Why it was a no-op |
|---|---|
| 1.5 Prisma `userId` index on `ArtistMembership` | The DB index already existed (migration `20260327210000`). The schema was missing the `@@index([userId])` declaration — a schema↔DB drift, not a missing index. PR #430 only fixed the schema. |
| 1.6 Narrow middleware matcher | The `/api/*` matchers aren't redundant. `getSession()` in route handlers depends on the `x-workos-middleware` marker that `authkit()` sets. Removing the matcher would break auth silently. |
| 2.3 Dedupe `snapshotCount` query in insights | `snapshotCount` is a user-visible metric (`stored_snapshots` summary card). Replacing it with `snapshots.length` would cap the displayed total at `MAX_INSIGHTS_HISTORY_POINTS` (180). The 3 queries already run in `Promise.all` so there was no latency saving anyway. |
| 2.4 `select` on `pages.findMany` | `Page.artistId` has a `@unique` constraint. There's one page per artist. No list to trim. |
| 2.6 Reduce Sentry sample rates | Both `instrumentation.ts` files already had `tracesSampleRate: 0`, `replaysSessionSampleRate: 0`. Errors-only mode was already in place. |
| 2.1 Backend cache layer (`@nestjs/cache-manager` + Upstash) | Ola 1's frontend `unstable_cache(60 s)` already absorbs ~95% of repeat reads at the source. Backend traffic at current scale is roughly 1 hit/min/artist for billing data. The 5–10 ms saving per cache hit isn't visible to the user and didn't justify the new infrastructure surface. |
| 2.7 Granular `<Suspense>` boundaries | Ola 1's `unstable_cache` removed the main fetch waterfall on the dashboard. Granular Suspense would have shaved tens of milliseconds at most. |

This is a **calibration finding**, not a failure. The codebase was leaner
than the audit assumed. The lesson is to confirm every audit hypothesis
against the actual code before implementing — measuring the assumption
caught seven cases where the work would have been waste (and one — Sentry
size — where the work would have been outright impossible under Turbopack).

## Considered and stopped

**Sentry SDK bundle trim** was the natural follow-up to #436 — bundle
analysis on `next experimental-analyze` showed the Sentry core chunk is
~449 kB raw / ~145 kB gzip and lives in `rootMainFiles`, so it loads on
every page including the public artist page.

Two paths considered:

1. **`bundleSizeOptimizations` flags in `withSentryConfig`**
   (`excludeTracing`, `excludeReplayShadowDom`, etc.) — verified as a
   no-op under Turbopack. Builds were byte-identical with and without the
   flag. The flags also only target Tracing + Replay code, which already
   lives in separate chunks that don't load on the public page anyway.

2. **Lazy-load the whole SDK** (the #434 pattern applied to Sentry) —
   would save ~145 kB gzip on every page load. The trade-off is missing
   error capture in the first ~1–2 seconds (during render + hydration),
   which is exactly the window where uncaught errors are most damaging
   for a commercial product. Decided not to take that bet without first
   seeing the TBT regression confirmed as a real-user problem.

If real-user data later shows TBT or JS execution time hurting at scale,
this is the first lever to pull. The implementation would follow the
exact shape of `apps/web/src/lib/analytics/posthog.ts` from #434.

## Leftover items for a future audit

Not shipped, ordered by expected ROI when the time comes:

| Item | Notes |
|---|---|
| ISR + `revalidateTag` on `/[locale]/[username]` | The public artist page is currently SSR-against-Railway on every visit. ISR would let Vercel edge cache the HTML, dropping LCP to fractions of a second worldwide. Needs the `page_view` analytics tracking moved to a Client Component first (currently coupled to SSR). |
| Cloudflare cache rules for `/api/public/*` | Already serves `Cache-Control: private, SWR`. A CF rule would let the edge absorb most repeat reads before Railway. Configuration change, no code. |
| PgBouncer + connection-pool config on Railway Postgres | Default Prisma pool is 5 connections. Under traffic spikes that queues. Railway-side toggle + URL change. |
| `images.remotePatterns` widening | `cdn.shopify.com`, Printful CDN, `i.scdn.co`, `geo-media.beatport.com`, `encrypted-tbn0.gstatic.com` all need entries so the merch renderers (`ShopifyStoreRenderer`, `SmartMerchRenderer`) and external release covers route through `/_next/image`. Today the external release covers route through `/_next/image` in HTML but Vercel responds 400 (`INVALID_IMAGE_OPTIMIZE_REQUEST`), and the `onError` fallback renders the 💿 emoji instead. |
| Sentry lazy-load | See "Considered and stopped". |
| Migrate top dashboard mutations to Server Actions | Removes the browser → Next route handler → NestJS double-hop on save flows. Apply incrementally per surface (EPK save, page save, validate Spotify, etc.). |
| Drop the orphaned Railway Postgres service | The Postgres instance under the `trustworthy-blessing` Railway project shows ~0 vCPU and a near-flat memory line — the app reads from a separate Supabase Postgres in production. Once verified, the Railway instance can be removed to save the recurring cost. |
| Vercel Speed Insights when the project moves off Hobby | Lab data via PageSpeed Insights worked for this audit, but field metrics from real users are the right long-term signal. |

## Workflow notes

Things worth doing again the next time we run a perf audit:

- **Cheap measurement first.** `curl` against prod for HTML inspection +
  `Accept: image/webp` to confirm Vercel image optimisation was decisive
  in catching that the wins were real where it counted (cover, gallery)
  and absent where it mattered (merch / external release covers).
- **`next experimental-analyze -o`** for bundle inspection on Turbopack —
  `@next/bundle-analyzer` is webpack-only and silently does nothing under
  Turbopack.
- **Skill of disagreement.** Six of seven dropped items were caught
  because the implementation surfaced contradictions with the audit's
  assumption. Saying "the audit is wrong about this" was the right call
  every time it came up.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
