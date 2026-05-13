# Cookie Consent Architecture

Status: implemented baseline for Privacy Plan E2.

## Consent Categories

| Category  | Purpose                                                                            | Examples                                                                                                                              | Legal basis                         | Consent required |
| --------- | ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------- | ---------------- |
| Necessary | Authentication, security, localization, rate limiting, core routing                | WorkOS/AuthKit session and PKCE/state cookies, `NEXT_LOCALE`, security/rate-limit metadata, QA cookie when explicitly used by testers | Contract and legitimate interests   | No               |
| Analytics | Product and public-page analytics, artist dashboard metrics, PostHog, future Umami | `sl_consent`, `sl_ac`, PostHog browser identifiers after opt-in, public page/link/smart-link analytics events                         | Consent for non-essential analytics | Yes              |
| Marketing | Future campaign attribution, advertising pixels, retargeting                       | No active launch implementation                                                                                                       | Consent                             | Yes              |

## Consent Storage

Canonical cookie:

- Name: `sl_consent`
- Type: first-party cookie
- Lifetime: 180 days
- SameSite: Lax
- Secure: enabled on HTTPS
- Value: encoded JSON consent record

Record shape:

```json
{
  "version": "2026-05-privacy-v1",
  "timestamp": "2026-05-13T00:00:00.000Z",
  "expiresAt": "2026-11-09T00:00:00.000Z",
  "categories": {
    "necessary": true,
    "analytics": false,
    "marketing": false
  }
}
```

Compatibility cookie:

- Name: `sl_ac`
- Values: `1` for analytics consent, `0` for rejected/absent analytics consent
- Purpose: compact API header forwarding through `X-SL-AC`
- Reason: existing analytics quality flags expect `1` / `0`

## Versioning Strategy

`CONSENT_VERSION` is currently `2026-05-privacy-v1`.

If the categories, purposes, providers, or legal bases materially change:

1. Update `CONSENT_VERSION`.
2. Users with old consent records are prompted again.
3. Keep backward-compatible parsing only for safe reads.

## Expiration Strategy

Consent expires after 180 days. Expired records are treated as no valid consent,
which reopens the banner and keeps non-essential tracking disabled.

## Withdrawal Strategy

When analytics or marketing consent is revoked:

- The consent record is rewritten.
- `sl_ac` becomes `0`.
- PostHog capture is opted out and reset.
- Known PostHog localStorage/sessionStorage/cookies are removed on a best-effort
  basis.
- Tracking calls remain gated by `isAnalyticsAllowed()`.

## Runtime Components

| File                                                          | Responsibility                                                           |
| ------------------------------------------------------------- | ------------------------------------------------------------------------ |
| `apps/web/src/lib/analytics/consent.ts`                       | Consent parsing, persistence, versioning, category helpers, change event |
| `apps/web/src/features/privacy/components/ConsentManager.tsx` | Banner, preferences modal, accept/reject/customize UI                    |
| `apps/web/src/lib/analytics/PostHogProvider.tsx`              | Initializes PostHog only after analytics consent                         |
| `apps/web/src/lib/analytics/posthog.ts`                       | PostHog init/withdrawal cleanup                                          |
| `apps/web/src/lib/analytics/track.ts`                         | Client-side analytics calls gated by consent                             |
| `apps/web/src/lib/public-api.ts`                              | Forwards consent header to API for SSR public page reads                 |
| `apps/web/src/app/go/[id]/route.ts`                           | Forwards consent header during SmartLink redirects                       |
| `apps/api/src/modules/public/*`                               | Persists public analytics only when `hasTrackingConsent === true`        |

## Necessary Cookies Boundary

Authentication, PKCE/state, locale, security, and rate-limit behavior must not be
blocked by the consent system. These are necessary for StageLink to work and are
not treated as optional analytics/marketing consent.
