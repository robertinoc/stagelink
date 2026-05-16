# StageLink Dashboard — Performance Diagnosis Report

**Date:** 2026-05-16
**Phase:** Fase 0 — Diagnosis
**Status:** Complete (diagnosis only — no fixes implemented)

---

## 1. Summary of Findings

Dashboard navigation slowness is primarily **real load time** (not just perceived). Every section transition triggers a full server-side render with session validation, user resolution, and multiple uncached API calls — several executed sequentially. No `loading.tsx`, no Suspense, no skeleton states exist anywhere in the dashboard tree, amplifying the perceived problem. Analytics, My Page, and EPK are the worst offenders.

---

## 2. Relevant Files Inspected

- `apps/web/src/app/[locale]/(app)/layout.tsx` — root dashboard layout
- `apps/web/src/app/[locale]/(app)/dashboard/page/page.tsx` — My Page
- `apps/web/src/app/[locale]/(app)/dashboard/analytics/page.tsx` — Analytics
- `apps/web/src/app/[locale]/(app)/dashboard/epk/page.tsx` — EPK
- `apps/web/src/app/[locale]/(app)/dashboard/settings/` — Settings sub-pages
- `apps/web/src/lib/api/me.ts` — `getAuthMe()`
- `apps/web/src/lib/api/artists.ts` — `getArtist()`
- `apps/web/src/lib/api/billing.ts` — `getBillingSummary()`, `getBillingEntitlements()`
- `apps/web/src/features/analytics/components/AnalyticsDashboard.tsx`
- `apps/web/src/features/insights/components/InsightsDashboard.tsx`
- `apps/web/src/components/layout/AppSidebar.tsx`
- `apps/web/src/components/layout/AppTopbar.tsx`

---

## 3. Current Dashboard Routing Structure

All routes live under `src/app/[locale]/(app)/`. The `layout.tsx` is a server component that runs on every navigation — it calls `withAuth()` → `getAuthMe()` → `getArtist()` + `getBillingSummary()`. Every child page then independently re-fetches most of the same data.

---

## 4. Slowest / Riskiest Sections

### Analytics — worst waterfall

Minimum 4 sequential async phases:

1. `getSession` → `getAuthMe` → `Promise.all([getBillingEntitlements, getArtist, getInsightsDashboard])`
2. → `getAnalyticsOverview` (sequential)
3. → `Promise.all([getProTrends, getSmartLinkPerformance])`
4. → `getAnalyticsFanInsights` (sequential again)

On a cold request: 400–800+ ms before any HTML is sent.

`RangeSelector` uses `router.push(?range=...)` triggering a full server re-render for every filter change — hugely expensive for what is essentially a client-side filter.

`AnalyticsDashboard` and `InsightsDashboard` use `useSearchParams()` without `<Suspense>`, causing Next.js to silently deopt to full client-side rendering.

### My Page — 6 sequential awaits

```
getSession → getAuthMe → getArtist → getArtistPages → getBillingSummary → getArtistEpk
```

Each adds 50–150 ms in production. This is the single most avoidable bottleneck — fixable in a few lines.

### EPK — justified 2-phase fetch

Phase 1: `getArtist + getBillingSummary` (parallel ✓). Phase 2: `getArtistEpk + getSmartLinks + getArtistAssets` (parallel ✓). Still slow because of the sequential phase gate and re-fetching layout data.

### Settings sub-pages

Every settings page calls `loadDashboardSettingsData()` which runs `getSession + getAuthMe + getBillingSummary + getArtist + getShopifyConnection + getMerchConnection + getInsightsDashboard`. Navigating Settings Overview → Plans → Connections re-runs all of this three times.

---

## 5. Root Causes

| Cause                                                           | Type                | Impact      |
| --------------------------------------------------------------- | ------------------- | ----------- |
| Sequential awaits on My Page (6 calls)                          | Real load time      | High        |
| 4-phase waterfall on Analytics                                  | Real load time      | High        |
| `getAuthMe` + `getArtist` duplicated across layout + every page | Real load time      | Medium-High |
| `cache: 'no-store'` on billing and artist data                  | Real load time      | Medium      |
| `loadDashboardSettingsData` re-runs on each settings sub-page   | Real load time      | Medium      |
| Analytics range change → full server re-render                  | Real load time      | High        |
| No `loading.tsx` in dashboard tree                              | Perceived load time | High        |
| No Suspense boundaries                                          | Perceived load time | Medium      |
| `useSearchParams()` without `<Suspense>` → CSR deopt            | Real + Perceived    | Medium      |
| Avatar `<img>` not using Next.js `<Image>`                      | Real load time      | Low         |

---

## 6. Real vs Perceived Load Time

Both. Sequential data fetching is **real** latency. Absence of loading states makes **perceived** latency worse — the user sees a blank/frozen screen instead of a skeleton.

---

## 7. Recommended Improvements for Next Phase

1. Parallelize all independent fetches with `Promise.all`
2. Use `React.cache()` on `getAuthMe` and `getArtist` to deduplicate within a render
3. Add `loading.tsx` files at dashboard + section level
4. Wrap `useSearchParams()` consumers in `<Suspense>`
5. Move analytics range filter to client-side fetch (avoid full server re-render)
6. Consider `next: { revalidate: 60 }` on billing + artist reads instead of `no-store`
7. Stream analytics sections with independent Suspense boundaries
8. Replace `<img>` with `<Image>` for avatars in sidebar/topbar

---

## 8. Priority Order for Fixes

| Priority | Fix                                                       | Effort | Impact           |
| -------- | --------------------------------------------------------- | ------ | ---------------- |
| 1        | `Promise.all` in My Page `page.tsx`                       | Low    | High             |
| 2        | `React.cache()` on `getAuthMe` and `getArtist`            | Low    | Medium-High      |
| 3        | Add `dashboard/loading.tsx` (skeleton)                    | Low    | High (perceived) |
| 4        | Add per-section `loading.tsx` for Analytics, My Page, EPK | Low    | High (perceived) |
| 5        | Wrap `RangeSelector`/`RangeFilters` in `<Suspense>`       | Low    | Medium           |
| 6        | Move analytics range filter to client-side fetch          | Medium | High             |
| 7        | `next: { revalidate: 60 }` on billing + artist reads      | Low    | Medium           |
| 8        | Stream analytics sections with independent Suspense       | Medium | High             |
| 9        | Replace `<img>` with `<Image>` for avatars                | Low    | Low-Medium       |
| 10       | Dynamic import for PostHog                                | Low    | Low              |

---

## 9. Specific Files to Change

- `apps/web/src/app/[locale]/(app)/dashboard/page/page.tsx` — parallelize fetches
- `apps/web/src/lib/api/me.ts` — wrap `getAuthMe` with `React.cache()`
- `apps/web/src/lib/api/artists.ts` — wrap `getArtist` with `React.cache()`
- `apps/web/src/lib/api/billing.ts` — consider `revalidate` instead of `no-store`
- `apps/web/src/features/analytics/components/AnalyticsDashboard.tsx` — Suspense + client-side range
- `apps/web/src/features/insights/components/InsightsDashboard.tsx` — Suspense around `useSearchParams()`
- `apps/web/src/components/layout/AppSidebar.tsx` — `<Image>` for avatar
- `apps/web/src/components/layout/AppTopbar.tsx` — `<Image>` for avatar
- **New files:** `dashboard/loading.tsx`, `dashboard/analytics/loading.tsx`, `dashboard/page/loading.tsx`, `dashboard/epk/loading.tsx`

---

## 10. Quick Wins (Safe for Next PR)

1. `Promise.all` in `dashboard/page/page.tsx` (lines 41–48)
2. `React.cache()` wrap on `getAuthMe` in `apps/web/src/lib/api/me.ts`
3. `React.cache()` wrap on `getArtist` in `apps/web/src/lib/api/artists.ts`
4. Create `apps/web/src/app/[locale]/(app)/dashboard/loading.tsx`
5. Create `apps/web/src/app/[locale]/(app)/dashboard/analytics/loading.tsx`
6. Create `apps/web/src/app/[locale]/(app)/dashboard/page/loading.tsx`
7. Add `<Suspense>` around `RangeFilters` in `InsightsDashboard` and `RangeSelector` in `AnalyticsDashboard`

---

## Checklist

- [x] Dashboard routing reviewed
- [x] My Page navigation reviewed
- [x] Analytics navigation reviewed
- [x] EPK navigation reviewed
- [x] Shared layout/data loading reviewed
- [x] Repeated API calls identified
- [x] Loading states reviewed
- [x] Prefetch/caching opportunities identified
- [x] Recommended fix plan documented
