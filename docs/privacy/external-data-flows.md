# External Data Flows

Status: Privacy Plan - third-party and integrations baseline.
Date: 2026-05-14

This document maps external data movement for StageLink. It focuses on what
leaves StageLink, what returns, where data is stored, and which controls are
required to keep the integration privacy-safe.

## Flow 1 - WorkOS Authentication

```text
User browser
  -> StageLink web /api/auth/signin or /api/auth/signup
  -> WorkOS AuthKit hosted authentication
  -> StageLink web /api/auth/callback
  -> StageLink API with WorkOS JWT bearer token
  -> Railway PostgreSQL local user/artist records
```

Data involved:

- email, name, auth method, session identifiers, security/Radar signals;
- WorkOS access/session token passed server-side from web to API;
- local StageLink user id, WorkOS id, and artist membership records.

Controls:

- keep `WORKOS_API_KEY` and `WORKOS_COOKIE_PASSWORD` server-only;
- keep redirect/callback allowlists environment-specific;
- do not log bearer tokens or callback codes;
- run provider-side deletion/revocation during DSAR erasure when applicable.

## Flow 2 - Stripe Billing

```text
Authenticated artist
  -> StageLink API billing endpoint
  -> Stripe Checkout or Customer Portal
  -> Stripe payment/subscription systems
  -> Stripe webhook
  -> StageLink API raw-body signature verification
  -> Railway PostgreSQL subscription + webhook idempotency records
```

Data involved:

- artist id, user/customer email, Stripe customer id, subscription id, price id;
- webhook event id/type/timestamp;
- subscription status and billing entitlement state.

Controls:

- never collect card data directly in StageLink;
- keep `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` server-only and
  environment-specific;
- retain Stripe references needed for tax, disputes, accounting, and billing
  reconciliation;
- disclose that Stripe may retain payment data under its own legal obligations.

## Flow 3 - PostHog Analytics

```text
User browser
  -> StageLink consent manager
  -> PostHog browser client only after analytics consent
  -> PostHog project

StageLink API
  -> PostHog server client only if POSTHOG_KEY is configured
```

Data involved:

- product events, page/view interaction events, pseudonymous identifiers;
- no event should include raw email, tokens, payment data, or message content.

Controls:

- do not initialize browser analytics before analytics consent;
- keep autocapture disabled unless separately reviewed;
- confirm PostHog project region, DPA, retention, and IP handling;
- do not use PostHog for advertising/retargeting unless marketing consent and
  policy language are added.

## Flow 4 - Spotify Insights

```text
Artist enters Spotify artist URL/id
  -> StageLink API validates artist reference
  -> Spotify Accounts client_credentials token
  -> Spotify Web API artist/top-tracks endpoints
  -> StageLink insights connection + snapshots
```

Data involved:

- StageLink sends app client credentials and artist id;
- StageLink receives public artist metadata, follower totals, popularity,
  genres, and top tracks;
- StageLink stores external account id, display name, external URL, metrics,
  and top-content snapshots.

Controls:

- current flow does not require user Spotify OAuth scopes;
- do not store Spotify app access tokens beyond in-memory cache;
- provide disconnect/delete behavior for local imported insights data;
- do not build derived user/listener profiles or AI/model-training use from
  Spotify content or metadata.

## Flow 5 - YouTube/Google Insights

```text
Artist enters YouTube channel URL/handle/id
  -> StageLink API validates channel reference
  -> YouTube Data API key request
  -> StageLink insights connection + snapshots
```

Data involved:

- StageLink sends channel id/handle and API key;
- StageLink receives public channel snippet/statistics/content details and
  recent video statistics;
- StageLink stores external account id/handle, metrics, and top-content
  snapshots.

Controls:

- current flow should remain API-key/public-data only unless a future feature
  requires owner OAuth;
- if OAuth is introduced, implement Google token revocation, authorized-data
  deletion, privacy-policy disclosures, and scope review before launch;
- avoid undocumented YouTube APIs and do not store audiovisual content copies.

## Flow 6 - SoundCloud Insights

```text
Artist enters SoundCloud profile URL/handle
  -> StageLink API resolve/profile request with SOUNDCLOUD_CLIENT_ID
  -> SoundCloud API v2 endpoints
  -> StageLink insights connection + snapshots
```

Data involved:

- StageLink sends profile URL/account id and `client_id`;
- StageLink receives public profile, avatar, followers count, track count, and
  top-track data;
- StageLink stores external account id/handle, metrics, and top-content
  snapshots.

Controls:

- treat SoundCloud as high policy risk because the current provider code notes
  API v2 is undocumented/unstable for third-party use;
- do not scrape or bypass access controls;
- remove local SoundCloud-derived personal data on disconnect/account deletion;
- prefer public links/embeds if official API permission is not confirmed.

## Flow 7 - Shopify Storefront

```text
Artist configures Shopify store domain + Storefront token
  -> StageLink API validates Shopify Storefront GraphQL
  -> Railway PostgreSQL encrypted token + selection config
  -> Public page requests product preview
  -> StageLink API fetches Shopify products/collections
  -> Public page renders products and links checkout to Shopify
```

Data involved:

- store domain, Storefront access token, store name, collection handle, product
  handles, product titles/images/prices/availability;
- no payment method or checkout data is collected by StageLink for Shopify.

Controls:

- Storefront tokens are encrypted at rest by application-level secret
  encryption;
- product preview cache is short-lived in memory;
- checkout remains on Shopify;
- disconnect deletes the local Shopify connection and token.

## Flow 8 - Printful Smart Merch

```text
Artist configures Printful API token
  -> StageLink API validates Printful stores
  -> Railway PostgreSQL encrypted token + store metadata
  -> Public page resolves selected products
  -> StageLink API fetches Printful product data
  -> Public page renders selected products and purchase links
```

Data involved:

- Printful API token, store id/name, product ids, product titles/images/prices;
- optional purchase URLs configured by artist.

Controls:

- API tokens are encrypted at rest;
- provider product caches are in-memory and short-lived;
- disconnect deletes the local connection/token;
- Printify is not implemented yet and must receive a separate scope review
  before activation.

## Flow 9 - Email and Contact Providers

```text
Landing contact form
  -> StageLink web /api/contact
  -> Resend email API
  -> StageLink operator inbox

Public artist contact block
  -> Browser EmailJS SDK
  -> EmailJS service/template
  -> Artist destination inbox
```

Data involved:

- visitor name, email, artist type, message, destination email, delivery
  metadata;
- current StageLink code does not persist the message body locally.

Controls:

- landing contact route validates, rate-limits, honeypot-checks, and escapes
  HTML email output;
- EmailJS public env values are browser-visible by design and must be treated
  as public identifiers, not secrets;
- public policy must disclose the active email provider(s) and retention
  expectations.

## Flow 10 - Object Storage and CDN

```text
Authenticated artist
  -> StageLink API upload intent
  -> S3/R2-compatible provider presigned URL
  -> Browser uploads object directly
  -> StageLink API confirm upload with HEAD check
  -> Public/private delivery via configured public base URL/CDN
```

Data involved:

- media files, object keys, mime type, size, original filename, delivery URL;
- files may contain likeness, names, logos, press images, or other personal
  data depending on artist upload.

Controls:

- object keys are generated server-side and tenant-scoped;
- client never receives provider credentials;
- deletion/orphan cleanup remains a launch-readiness item;
- bucket region, lifecycle rules, and public/private policy must be confirmed.

## Flow 11 - Public Embeds and External Links

```text
Visitor opens public artist page / EPK
  -> StageLink renders embed/link blocks
  -> Visitor browser may request Spotify/YouTube/SoundCloud/etc. directly
```

Data involved:

- visitor IP/device metadata is visible to the external provider when embeds
  load or links are clicked;
- third-party cookies or local storage may be created by embed providers.

Controls:

- current consent phase did not implement click-to-load embed blockers;
- consider placeholders for providers that set cookies or trackers before
  user interaction;
- artist terms should state that artists are responsible for rights and lawful
  publication of embedded/public content.

## Flow 12 - CI/CD and Operational Tooling

```text
Developer push / PR
  -> GitHub Actions
  -> Vercel/Railway deployments
  -> Build/test/deployment logs and artifacts
```

Data involved:

- code, env var names, masked secret references, screenshots/videos from E2E,
  logs, deployment metadata.

Controls:

- do not upload auth artifacts or unmasked browser storage;
- keep GitHub secrets environment-scoped;
- minimize artifact retention and avoid test accounts with real personal data.
