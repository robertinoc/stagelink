# Basic Analytics Dashboard — T4-2

## Source of Truth

**Local `analytics_events` table (Prisma/PostgreSQL).**

Events are written directly to this table at ingestion time:

| Event type              | Written by                            | Trigger                                            |
| ----------------------- | ------------------------------------- | -------------------------------------------------- |
| `page_view`             | `PublicPagesService.loadPublicPage()` | Every non-bot public page load                     |
| `link_click`            | `POST /api/public/events/link-click`  | Browser reports click via `trackPublicLinkClick()` |
| `smart_link_resolution` | `SmartLinksService.resolve()`         | Every smart link redirect                          |

**Why local DB instead of PostHog?**

PostHog (also instrumented in T4-1) is for external analytics and advanced dashboards. The local DB:

- Works without `POSTHOG_KEY` (dev/test environments)
- Enables SQL aggregations via Prisma (no external API calls)
- Gives full control for deduplication, quality filtering, and billing-gated features
- PostHog continues receiving all events in parallel for advanced analytics (T4-4, T6-4)

---

## Metrics

### page_views

- **Event**: `eventType = 'page_view'`
- **Counted**: Once per `loadPublicPage()` call where `ctx` is present and UA is not a bot
- **Current limitation**: Does not deduplicate by IP — same visitor loading the page multiple times counts multiple times. Unique visitor counting is T4-4.
- **Bot filtering**: UA-pattern regex applied at ingestion (`isBotUserAgent`). Comprehensive bot IP filtering is T4-4.

### link_clicks

- **Event**: `eventType = 'link_click'`
- **Counted**: Once per click reported by `trackPublicLinkClick()` from the browser via `POST /api/public/events/link-click`
- **Includes**: Regular links and smart links (both report via the same path)
- **Current limitation**: Client-reported — relies on browser executing the fetch. A user navigating away very quickly could miss the event (mitigated by `keepalive: true` on the fetch).

### ctr

- **Formula**: `linkClicks / pageViews` (rounded to 4 decimal places, expressed as decimal: `0.17` = 17%)
- **Edge case**: Returns `0` when `pageViews = 0` (no division-by-zero)
- **Meaning**: How many page views resulted in at least one click on a link. Note: a single visitor clicking 3 links counts as 3 `link_click` events vs 1 `page_view`, so CTR can exceed 100%.

### top_links

- **Identity**: Each link item is identified by `linkItemId` (stable ID from block config)
- **Grouped by**: `linkItemId` + `label` + `blockId` + `isSmartLink` + `smartLinkId`
- **Sorted**: By click count descending
- **Limit**: Top 10

### smart_link_resolutions

- **Event**: `eventType = 'smart_link_resolution'`
- **Counted**: Once per smart link resolve (platform-aware redirect via `/go/[id]`)
- **Note**: This metric is independent from `link_clicks` — a visitor clicks a smart link item (1 `link_click`) then the backend resolves it to a platform URL (1 `smart_link_resolution`).

---

## API Endpoints

### GET /api/analytics/:artistId/overview

Aggregated analytics for an artist.

**Auth**: Requires valid session + at least `read` membership on the artist.

**Query params**:

- `range`: `7d` | `30d` | `90d` — defaults to `30d`

**Response shape**:

```json
{
  "artistId": "clxxx",
  "range": "30d",
  "summary": {
    "pageViews": 1234,
    "linkClicks": 210,
    "ctr": 0.1701,
    "smartLinkResolutions": 80
  },
  "topLinks": [
    {
      "linkItemId": "item_abc",
      "label": "Spotify",
      "blockId": "block_1",
      "clicks": 90,
      "isSmartLink": false,
      "smartLinkId": null
    },
    {
      "linkItemId": "item_def",
      "label": "Listen now",
      "blockId": "block_2",
      "clicks": 70,
      "isSmartLink": true,
      "smartLinkId": "sl_xyz"
    }
  ],
  "notes": {
    "dataQuality": "basic",
    "botFilteringApplied": true,
    "deduplicationApplied": false
  }
}
```

**Authorization**: `OwnershipGuard` + `@CheckOwnership('artist', 'artistId', 'read')` — returns 404 if artist doesn't exist or caller is not a member.

### POST /api/public/events/link-click

Reports a link click from the browser. Unauthenticated.

**Body**:

```json
{
  "artistId": "clxxx",
  "blockId": "block_1",
  "linkItemId": "item_abc",
  "label": "Spotify",
  "isSmartLink": false,
  "smartLinkId": null
}
```

**Returns**: `204 No Content`

**Security**: Rate-limited by IP (shared with smart-link resolve — 120 req/60s). Errors are silently swallowed. Full event integrity validation (blockId ownership check) is T4-4.

---

## Date Ranges

Three presets are supported:

| Preset | Days | Label (en)   |
| ------ | ---- | ------------ |
| `7d`   | 7    | Last 7 days  |
| `30d`  | 30   | Last 30 days |
| `90d`  | 90   | Last 90 days |

Custom date ranges are not supported in basic analytics. They ship in T6-4 (Analytics Pro).

---

## Frontend

**Route**: `/{locale}/dashboard/analytics`

**Architecture**:

- Server Component (`page.tsx`) — fetches data server-side with the session access token; reads `?range` from URL search params
- Client Component (`AnalyticsDashboard.tsx`) — handles range selector (navigates to `?range=...`), renders cards + table

**Loading**: Range switches trigger a Next.js page navigation (URL changes), which re-runs the server component. No client-side fetch needed.

**Files**:

- `apps/web/src/app/[locale]/(app)/dashboard/analytics/page.tsx` — server page
- `apps/web/src/features/analytics/components/AnalyticsDashboard.tsx` — client component
- `apps/web/src/lib/api/analytics.ts` — typed API client

---

## Data Quality / Limitations (V1)

| Limitation                      | Status                                                      | Planned fix                                      |
| ------------------------------- | ----------------------------------------------------------- | ------------------------------------------------ |
| No unique visitor deduplication | IP hash stored but not used for dedup                       | T4-4                                             |
| Basic UA-only bot filtering     | Regex at ingestion                                          | T4-4 (IP reputation, headless browser detection) |
| No internal traffic exclusion   | Admin/artist views counted                                  | T4-4                                             |
| Link click is client-reported   | Could miss very fast navigations (mitigated by `keepalive`) | T4-4                                             |
| Smart link click ≠ resolution   | Click and resolution are separate events; may not be equal  | Documented by design                             |
| No geo/device breakdown         | `country` and `device` columns exist but not populated      | T4-4                                             |
| CTR can exceed 100%             | Multiple clicks per visit count                             | Documented by design                             |

The dashboard surface shows a data quality note (`dataQuality: 'basic'`, `deduplicationApplied: false`) so users understand these are preliminary numbers.

---

## What ships in T4-4

- Unique visitor deduplication via IP hash
- Internal traffic exclusion (artist/member visits don't count)
- Comprehensive bot filtering (IP reputation)
- Geo + device breakdown (populate `country` and `device` columns)
- Per-link CTR (clicks on that link / total page views)
- Time-series data (views/clicks per day)

## What ships in T6-4 (Analytics Pro)

- Custom date ranges
- Country / device breakdown charts
- Funnel analysis (page view → click → smart link resolve)
- CSV export
- Multiple comparison periods
- Subscriber growth analytics
- Revenue attribution (T5 dependency)
