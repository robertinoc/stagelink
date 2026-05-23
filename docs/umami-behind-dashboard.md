# Umami Platform Dashboard In Behind

Status: v1 active when the public StageLink Platform Umami env vars are
configured.

## Scope

Umami is for StageLink platform analytics. It should collect product and growth
traffic from `https://stagelink.art`, then show that dashboard inside Behind.

Behind is the operator console where the dashboard is reviewed. Behind is not
the tracked product surface.

Umami should measure:

- landing and marketing traffic on `stagelink.art`;
- signup and login intent;
- onboarding and authenticated product pageviews;
- dashboard route usage under `/{locale}/dashboard`.

Umami should not measure:

- `behind.stagelink.art` pageviews or operator behavior;
- public artist pages under `/p/{username}` in this v1;
- artist-specific performance or fan traffic.

## Website Structure

Create one Umami website:

- Name: `StageLink Platform`
- Domain: `stagelink.art`
- Tracking variable: `NEXT_PUBLIC_UMAMI_PLATFORM_WEBSITE_ID`
- Optional generic tracking variable: `NEXT_PUBLIC_UMAMI_WEBSITE_ID`
- Embed variable: `NEXT_PUBLIC_UMAMI_PLATFORM_SHARE_URL`

Keep `NEXT_PUBLIC_UMAMI_DOMAINS=stagelink.art` in production. The web app also
checks the current hostname before injecting the Umami script, so a copied
website ID does not accidentally track Behind or local routes.

## Runtime Integration

Files:

- `apps/web/src/lib/analytics/UmamiProvider.tsx`
- `apps/web/src/lib/analytics/umami.ts`
- `apps/web/src/app/[locale]/(home)/layout.tsx`
- `apps/web/src/app/[locale]/(marketing)/layout.tsx`
- `apps/web/src/app/[locale]/(auth)/layout.tsx`
- `apps/web/src/app/[locale]/(app)/layout.tsx`
- `apps/web/src/app/[locale]/onboarding/page.tsx`
- `apps/web/src/app/behind/analytics/page.tsx`
- `apps/web/src/app/behind/BehindAnalyticsPanel.tsx`

The provider is mounted only in platform route groups/pages so it covers
marketing, auth, onboarding, suspended, and authenticated dashboard routes. It is
not mounted in `apps/web/src/app/behind/layout.tsx` or localized public artist
routes.

The `/behind/analytics` page embeds the shared Umami dashboard for the platform
website and adds operator context around it.

## Event Taxonomy

Current explicit platform events:

- `platform_signup_started`
- `platform_signup_login_clicked`
- `platform_login_started`
- `platform_login_signup_clicked`

Core pageview analysis should use Umami URLs and filters:

- `/`
- `/{locale}`
- `/{locale}/signup`
- `/{locale}/login`
- `/{locale}/onboarding`
- `/{locale}/dashboard`
- `/{locale}/dashboard/*`

Allowed explicit event properties:

- product surface;
- route section;
- coarse source/medium/campaign/content values from UTM parameters.

Do not send user email, artist handle, user id, artist id, name, free-text
search query, or outreach content to Umami.

## Dashboard V1

The `/behind/analytics` page is the StageLink Platform analytics operating
center. It keeps the shared Umami iframe as the primary data source and adds
StageLink context around it.

Current sections:

1. Traffic overview: platform pageviews, visitors, visits, referrers, devices,
   and geography from the Umami dashboard.
2. UTM campaigns: naming for acquisition links into signup and product entry.
3. Product events: explicit signup/login intent events plus dashboard pageviews.
4. Manual validation: visible end-to-end checks for the active platform setup.

The future native dashboard path is intentionally documented but not implemented
in v1. A later API-backed version should fetch Umami metrics server-side and
avoid exposing API tokens in the browser.

## Validation Checklist

Use `docs/umami-operational-checklist.md` as the source checklist for
production setup, route validation, event validation, and privacy guardrails.

Minimum release checks:

1. Configure `NEXT_PUBLIC_UMAMI_PLATFORM_WEBSITE_ID`.
2. Configure `NEXT_PUBLIC_UMAMI_PLATFORM_SHARE_URL` when the embedded dashboard
   should render inside `/behind/analytics`.
3. Keep `NEXT_PUBLIC_UMAMI_DOMAINS=stagelink.art`.
4. Deploy and open `https://stagelink.art/`.
5. Accept analytics consent and confirm the Umami script is present.
6. Confirm signup/login pageviews and `platform_*` events appear in the
   `StageLink Platform` website.
7. Open an authenticated dashboard route and confirm dashboard pageviews appear.
8. Confirm the script is absent on `behind.stagelink.art`.
9. Open `/behind/analytics` and confirm the embedded dashboard renders.
10. Confirm public artist pages remain out of this Umami website in v1.
