# Tracking Inventory

Status: audited and updated during Privacy Plan E2.

## Active Tracking Systems

### PostHog Browser Analytics

Files:

- `apps/web/src/lib/analytics/posthog.ts`
- `apps/web/src/lib/analytics/PostHogProvider.tsx`
- `apps/web/src/lib/analytics/track.ts`

Before E2:

- `PostHogProvider` initialized PostHog on mount when `NEXT_PUBLIC_POSTHOG_KEY`
  existed.
- `isAnalyticsAllowed()` used an opt-out model where no cookie meant allowed.

After E2:

- PostHog initializes only when `sl_consent.categories.analytics === true`.
- Capture helpers return before sending events if analytics consent is absent.
- Withdrawal calls PostHog opt-out/reset and removes known PostHog storage keys.

### StageLink Local Public Analytics

Files:

- `apps/api/src/modules/public/public-pages.service.ts`
- `apps/api/src/modules/public/public-subscribe.service.ts`
- `apps/api/src/modules/smart-links/smart-links.service.ts`
- `apps/web/src/lib/analytics/track.ts`
- `apps/web/src/lib/public-api.ts`
- `apps/web/src/app/go/[id]/route.ts`

Events:

- `page_view`
- `link_click`
- `smart_link_resolution`
- `fan_capture_submit`

After E2:

- Events are persisted only when API quality flags resolve
  `hasTrackingConsent === true`.
- Browser link-click API calls are not made before consent.
- Public page content still loads normally without analytics persistence.

### Umami

Current repo status:

- No active Umami script, package usage, or `NEXT_PUBLIC_UMAMI` runtime usage was
  found in the audited source.

Launch rule:

- If Umami is added later, it must be initialized only after analytics consent
  and documented in this file.

### Stripe

Current use:

- Stripe powers billing/subscriptions and webhooks.
- Stripe checkout/payment surfaces may set necessary/payment-related cookies on
  Stripe-controlled domains.

Consent posture:

- Payment cookies required to complete a user-requested purchase are treated as
  necessary for that transaction.
- Stripe must not be used for marketing/advertising tracking without consent.

### WorkOS AuthKit

Current use:

- Authentication, PKCE/state, encrypted session cookies, sign-in/sign-out.

Consent posture:

- Necessary. Must not be blocked by cookie consent.

### Third-Party Embeds

Current product areas:

- Music/video embeds and social/media links may involve Spotify, YouTube,
  SoundCloud, and other artist-selected providers.

Privacy posture:

- Embeds can create third-party tracking risk if they load remote scripts or
  iframes before user interaction.

Current E2 scope:

- No broad embed blocker was implemented in this phase.

Future check:

- Audit embed renderers and consider click-to-load placeholders for providers
  that set third-party cookies before user interaction.

## Storage Audit

| Mechanism                    | Current use                            | Consent posture                   |
| ---------------------------- | -------------------------------------- | --------------------------------- |
| `sl_consent` cookie          | Canonical consent record               | Necessary for consent record      |
| `sl_ac` cookie               | Analytics consent compatibility header | Necessary for consent enforcement |
| `NEXT_LOCALE` cookie         | Locale preference/routing              | Necessary/preference              |
| WorkOS cookies               | Auth/session/PKCE                      | Necessary                         |
| `sl_qa` cookie               | QA-only analytics exclusion            | Internal testing only             |
| PostHog localStorage/cookies | Product analytics identifiers          | Only after analytics consent      |
| Umami storage                | Not active                             | Must be consent-gated if added    |

## No-Consent Expected Behavior

Before optional consent:

- No PostHog initialization.
- No public link-click analytics request.
- No public page-view analytics persistence.
- No SmartLink analytics persistence.
- No analytics cookies/localStorage identifiers from PostHog.
- Auth, public pages, onboarding, and billing flows remain functional.
