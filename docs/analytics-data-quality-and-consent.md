# Analytics Data Quality & Consent (T4-4)

## Overview

StageLink persists **every analytics event** — including bots, internal previews, and QA sessions — with quality flags set at write time. Dashboard queries filter on these flags at aggregation time. This preserves the full raw event log for debugging while ensuring artists see clean metrics.

---

## Quality Flags

Five boolean/string columns on `analytics_events`:

| Column                 | Type       | Default        | Meaning                                                            |
| ---------------------- | ---------- | -------------- | ------------------------------------------------------------------ |
| `is_bot_suspected`     | `boolean`  | `false`        | UA matched known bot/crawler pattern                               |
| `is_internal`          | `boolean`  | `false`        | Flagged as internal/preview traffic (`X-SL-Internal: 1`)           |
| `is_qa`                | `boolean`  | `false`        | QA session (`X-SL-QA: 1`, set via `?sl_qa=1`)                      |
| `has_tracking_consent` | `boolean?` | `null`         | Visitor consent from `sl_ac` cookie (`null` = unknown/server-side) |
| `environment`          | `string`   | `'production'` | `production` \| `staging` \| `development`                         |

### Dashboard filter (applied at query time)

```sql
WHERE is_bot_suspected = false
  AND is_internal = false
  AND is_qa = false
  AND environment = 'production'
```

All raw events are retained — this filter only applies to aggregation queries in `AnalyticsService.getOverview()`.

---

## Bot Detection

`detectBotFromUserAgent(ua)` in `apps/api/src/common/utils/analytics-flags.ts`:

- Regex matches ~30 known bot/crawler patterns (Googlebot, Baiduspider, curl, Playwright, etc.)
- **Empty UA** → flagged as bot (conservative — real browsers always send a UA)
- False-negative rate is intentionally low: better to count a bot as a real visit than to lose real fan traffic
- PostHog server-side bot filtering provides an independent second layer

---

## Consent Strategy

**Model: opt-out with notice.**

Basic aggregate analytics (page view counts, link clicks) run under **legitimate interest**:

- No cross-site tracking
- No advertising profiles
- No personal data sold or shared
- IP is always SHA-256 hashed before storage — never persisted raw

### Consent Cookie

| Cookie  | Values                          | Lifetime |
| ------- | ------------------------------- | -------- |
| `sl_ac` | `1` = accepted · `0` = rejected | 365 days |

- Set by `AnalyticsConsentBanner` on the public artist page
- Absent cookie = first visit = default allow (opt-out model)
- Read server-side in `public-api.ts` → forwarded as `X-SL-AC` header → persisted as `has_tracking_consent`

### PostHog

- **Client-side**: `isAnalyticsAllowed()` gates all `ph.capture()` calls in `track.ts`
- **Server-side**: PostHog events are not fired for bot / internal / QA traffic (see `public-pages.service.ts`)

---

## QA Mode

Append `?sl_qa=1` to any public artist page URL to enter QA mode:

1. `QaModeInitializer` (client component) reads the param and sets `sl_qa=1` session cookie
2. On subsequent requests, `public-api.ts` reads the cookie and forwards `X-SL-QA: 1`
3. API resolves `isQa = true` → events are excluded from dashboard aggregations
4. QA mode ends when the browser tab/session closes (session cookie, no Max-Age)

---

## Header Flow

```
Browser
  └── ?sl_qa=1 URL param ──────────────────────────────────────────┐
  └── sl_ac cookie (set by AnalyticsConsentBanner) ─────────────────┤
                                                                    │
Next.js Server (public-api.ts / SSR)                               │
  └── Reads sl_ac, sl_qa from Cookie header                        │
  └── Forwards as X-SL-AC, X-SL-QA headers ──────────────────────►│
                                                                    │
NestJS API (public-pages.controller.ts, etc.)                      │
  └── Reads X-SL-AC, X-SL-QA, X-SL-Internal, User-Agent          │
  └── resolveTrafficFlags() → TrafficFlags                         │
  └── Spreads flags into analyticsEvent.create() ◄────────────────┘

Browser (client-side link clicks, track.ts)
  └── Reads sl_ac, sl_qa from document.cookie
  └── Includes X-SL-AC, X-SL-QA in POST /api/public/events/link-click
  └── PostHog calls gated by isAnalyticsAllowed()
```

---

## Affected Services

| Service / File                                                       | Change                                                                            |
| -------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `prisma/schema.prisma`                                               | 5 new columns on `analytics_events` + quality flags index                         |
| `prisma/migrations/20260331000002_analytics_quality_flags/`          | Migration SQL                                                                     |
| `common/utils/analytics-flags.ts`                                    | `detectBotFromUserAgent`, `resolveTrafficFlags`                                   |
| `modules/public/public-pages.controller.ts`                          | Reads X-SL-\* headers, passes to service                                          |
| `modules/public/public-pages.service.ts`                             | All events persisted; flags spread into DB create; PostHog gated on clean traffic |
| `modules/public/public-blocks.controller.ts`                         | Reads X-SL-\* headers for fan_capture events                                      |
| `modules/public/public-subscribe.service.ts`                         | Flags spread into fan_capture_submit event                                        |
| `modules/public/public-smart-links.controller.ts`                    | Reads X-SL-\* headers                                                             |
| `modules/smart-links/smart-links.service.ts`                         | Flags spread into smart_link_resolution event                                     |
| `modules/analytics/analytics.service.ts`                             | `QUALITY_FILTER` applied to all aggregation queries                               |
| `modules/analytics/dto/analytics-response.dto.ts`                    | Richer `AnalyticsNotesDto`                                                        |
| `lib/analytics/consent.ts` _(web)_                                   | Cookie helpers: `readConsentCookie`, `setConsentCookie`, `isAnalyticsAllowed`     |
| `lib/analytics/track.ts` _(web)_                                     | PostHog gated; X-SL-\* headers included in API calls                              |
| `lib/public-api.ts` _(web)_                                          | Forwards X-SL-AC, X-SL-QA, User-Agent to API on SSR page requests                 |
| `features/public-page/components/AnalyticsConsentBanner.tsx` _(web)_ | Opt-out notice UI                                                                 |
| `features/public-page/components/QaModeInitializer.tsx` _(web)_      | Sets sl_qa session cookie from URL param                                          |
| `app/(public)/p/[username]/page.tsx` _(web)_                         | Includes banner + QA initializer                                                  |
| `features/analytics/components/AnalyticsDashboard.tsx` _(web)_       | Shows 'standard' quality note                                                     |
| `lib/api/analytics.ts` _(web)_                                       | Updated `AnalyticsNotes` type                                                     |

---

## Data Retention

Raw events (including bots, QA, internal) are **never deleted** automatically. The quality flags allow retroactive re-analysis as filtering heuristics improve. A data retention policy (e.g. delete events older than 2 years) can be implemented independently without changing the filtering logic.

---

## Future Improvements

| Item                       | Description                                                            |
| -------------------------- | ---------------------------------------------------------------------- |
| **IP deduplication**       | Count unique visitors using `ip_hash` within a time window             |
| **Consent granularity**    | Separate consent for analytics vs marketing                            |
| **GPC / DNT signal**       | Respect Global Privacy Control header                                  |
| **Stricter bot detection** | IP reputation lookup, headless browser fingerprinting                  |
| **Custom domain QA mode**  | Forward `X-SL-Internal` from Cloudflare Worker for preview deployments |
