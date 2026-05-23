# Umami Operational Checklist

Status: active for StageLink Platform when the public Umami env vars are
configured.

## Production Environment

Configure these variables in the Vercel project that serves `stagelink.art`:

- `NEXT_PUBLIC_UMAMI_PLATFORM_WEBSITE_ID`: required. Use the `data-website-id`
  value from the `StageLink Platform` website in Umami.
- `NEXT_PUBLIC_UMAMI_PLATFORM_SHARE_URL`: recommended. Use the Umami shared
  dashboard URL so Behind can embed the platform analytics dashboard at
  `/behind/analytics`.
- `NEXT_PUBLIC_UMAMI_SCRIPT_URL`: optional. Default for Umami Cloud is
  `https://cloud.umami.is/script.js`.
- `NEXT_PUBLIC_UMAMI_HOST_URL`: leave empty for Umami Cloud. Set only for a
  self-hosted Umami collection endpoint.
- `NEXT_PUBLIC_UMAMI_DOMAINS`: use `stagelink.art`. Add preview domains only
  when intentionally validating preview traffic.

Railway does not need these variables because the Umami browser script and the
Behind iframe are Next.js/Vercel frontend concerns.

## Expected Website Setup

- Umami website name: `StageLink Platform`.
- Umami website domain: `stagelink.art`.
- Tracking source: product and growth surfaces on `stagelink.art`.
- Dashboard location: `https://behind.stagelink.art/behind/analytics`.
- Behind scope: viewer only. Behind must not be the tracked product surface.

## Route Validation

The Umami script should load, after analytics consent, on:

- `https://stagelink.art/`;
- localized marketing pages, such as `https://stagelink.art/es`;
- localized auth pages, such as `https://stagelink.art/es/signup` and
  `https://stagelink.art/es/login`;
- onboarding routes;
- authenticated product routes under `/{locale}/dashboard`.

The Umami script should not load on:

- `https://behind.stagelink.art/`;
- `https://behind.stagelink.art/behind`;
- `https://behind.stagelink.art/behind/analytics`;
- public artist pages under `/p/{username}`, unless a separate product/privacy
  review explicitly adds them later.

## Manual Event Validation

In the `StageLink Platform` Umami website, validate:

- pageview for `stagelink.art`;
- pageview for `/es/signup`;
- `platform_signup_started` after submitting the signup form;
- `platform_signup_login_clicked` when clicking the login link from signup;
- `platform_login_started` after submitting the login form;
- `platform_login_signup_clicked` when clicking the signup link from login;
- pageview for `/es/dashboard` after authenticated navigation.

Signup completion is inferred in v1 from the authenticated post-signup pageview
or onboarding/dashboard entry. A future API-backed phase can add a server-side
conversion event if it is needed.

## Dashboard V1 Validation

In `https://behind.stagelink.art/behind/analytics`, validate:

- the embedded Umami dashboard renders when
  `NEXT_PUBLIC_UMAMI_PLATFORM_SHARE_URL` is configured;
- the iframe shows the `StageLink Platform` website, not a Behind website;
- the page shows Traffic overview, UTM campaigns, tracked platform events, and
  manual validation sections;
- the native dashboard path is presented as future API-backed work, not as an
  active API integration.

## End-to-End Validation

Use this sequence before closing the platform setup:

1. Open `https://stagelink.art/`.
2. Grant analytics consent.
3. Confirm the Umami script is present on `stagelink.art`.
4. Open `/es/signup`.
5. Trigger signup and login intent events.
6. Open `/es/dashboard` with an authenticated account.
7. Confirm pageviews and `platform_*` events appear in the `StageLink Platform`
   Umami website.
8. Open `https://behind.stagelink.art/behind/analytics`.
9. Confirm Behind embeds the same platform dashboard.
10. Confirm the Umami script itself is absent on Behind routes.

## Privacy Guardrails

- Do not send emails, names, handles, user IDs, artist IDs, or free-text search
  queries to Umami.
- Explicit event properties must describe product context only.
- Keep `NEXT_PUBLIC_UMAMI_DOMAINS=stagelink.art` in production.
- Keep public artist page tracking out of this Umami website until there is a
  separate product/privacy decision.
