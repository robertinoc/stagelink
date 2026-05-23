# API Scope Review

Status: Privacy Plan - third-party and integrations baseline.
Date: 2026-05-14

This review applies least privilege to current and planned external provider
access.

## Scope Matrix

| Provider       | Current credential/scope                                         | Needed for current feature?                                     | Least-privilege decision                            | Action                                                        |
| -------------- | ---------------------------------------------------------------- | --------------------------------------------------------------- | --------------------------------------------------- | ------------------------------------------------------------- |
| WorkOS AuthKit | AuthKit app client, API key, session/JWT validation              | Yes                                                             | Auth/session only; Radar/security features allowed  | Keep server-only and env-specific                             |
| Spotify        | Client Credentials, artist/profile/top-tracks read               | Yes for public insights                                         | No user OAuth scopes today                          | Keep; do not add user scopes without new review               |
| YouTube        | Data API key, `channels`, `playlistItems`, `videos` public reads | Yes for public channel insights                                 | API-key public data only                            | Keep; do not add OAuth scopes until owner-only feature exists |
| SoundCloud     | `SOUNDCLOUD_CLIENT_ID`, public profile/tracks reads              | Yes for SoundCloud insights, but policy-fragile                 | Treat as provisional/high risk                      | Confirm official permission or downgrade feature              |
| Stripe         | Secret key + webhook secret                                      | Yes for checkout/portal/subscriptions                           | Billing-only; no raw card data                      | Keep; confirm webhook secret by env                           |
| Shopify        | Storefront token; product/collection/shop read                   | Yes for store block                                             | Storefront read only                                | Keep; document no Admin API tokens                            |
| Printful       | API token; stores/products read                                  | Yes for Smart Merch if enabled                                  | Product/store read only where possible              | Keep; document token authority and rotation                   |
| Printify       | Future provider enum; not implemented                            | No current feature                                              | No scopes/credential yet                            | Review before implementation                                  |
| PostHog        | Project API key                                                  | Yes if analytics enabled                                        | Consent-gated analytics only; no autocapture/ads    | Keep with consent and retention controls                      |
| Umami          | Public website ID and optional share URL                         | Yes for StageLink Platform analytics if env vars are configured | Platform web analytics; no API token in v1          | Keep scoped to `stagelink.art`; confirm provider evidence     |
| Resend         | API key for outbound email                                       | Yes if landing contact enabled                                  | Send-only transactional/contact email               | Keep server-only                                              |
| EmailJS        | public key/service/template ids                                  | Yes if public contact block enabled                             | Browser public identifiers only                     | Keep; do not treat public keys as secrets                     |
| Upstash Redis  | REST URL/token                                                   | Yes if Behind roles configured                                  | Role/admin metadata only; TTL for counters if added | Keep server-only                                              |
| S3/R2 storage  | bucket/region/access key/secret                                  | Yes for uploads                                                 | Presigned upload only; scoped object keys           | Keep server-only and lifecycle-reviewed                       |

## Provider-Specific Findings

### Spotify

Current scope posture is good: StageLink uses Client Credentials rather than
artist/user OAuth. This avoids storing Spotify user refresh tokens and reduces
DSAR complexity.

Do not add:

- playlist/library scopes;
- user email/profile scopes;
- write scopes;
- playback/streaming scopes;
- scopes intended for future, unbuilt features.

Operational constraints:

- Spotify policy requires transparent privacy disclosure, data control, and
  deletion when users disconnect or prevent access.
- Spotify metadata/content must not be used as a standalone product, for AI
  training, or for advertising/profiling beyond the disclosed feature.

### YouTube/Google

Current posture uses `YOUTUBE_DATA_API_KEY` and public channel data, not OAuth.
This should remain the launch posture unless private owner analytics become a
paid feature.

Do not add at launch:

- write/upload scopes;
- YouTube Analytics scopes;
- Google account/profile/email scopes;
- offline access/refresh tokens.

If OAuth is added later:

- request scopes contextually;
- request only scopes already used by visible product functionality;
- implement programmatic token revocation;
- delete authorized Google/YouTube API data after revocation within the policy
  window required by Google/YouTube;
- add Google/YouTube disclosures to Privacy Policy and Terms.

### SoundCloud

Current code uses API v2 endpoints with `client_id` and browser-like headers.
That is operationally fragile and needs product/legal acceptance before broad
public launch.

Launch options:

1. Confirm official SoundCloud API access and terms posture, then keep sync.
2. Keep SoundCloud as public link/embed only and disable server-side metric
   sync.
3. Treat SoundCloud insights as beta/internal until provider status is clearer.

The recommended launch posture is option 1 or 2, not silent production use
without documented acceptance.

### Shopify

Use only Storefront access tokens for the current product block. Admin API
tokens are unnecessary and should be rejected by documentation and UI guidance.

Allowed:

- shop summary;
- product/collection read;
- public checkout link to Shopify.

Not allowed without new review:

- customer data;
- orders;
- payment data;
- Admin API write scopes;
- webhook ingestion.

### Printful / Printify

Printful is implemented; Printify is not. Current Printful use reads store and
product data.

Allowed:

- validate token/store;
- list products;
- resolve selected products.

Not allowed without new review:

- creating orders;
- reading customers;
- reading fulfillment addresses;
- webhook ingestion;
- Printify activation.

### Resend and EmailJS

Resend should remain server-side and send-only. EmailJS public keys are
browser-visible by design and should be documented as public identifiers.

Do not send through either provider:

- auth tokens;
- payment data;
- internal IDs unless necessary for support;
- unnecessary analytics identifiers.

### PostHog and Umami

PostHog is active only if env is set and consent is granted for public/browser
traffic. Umami is active only for StageLink Platform analytics when
`NEXT_PUBLIC_UMAMI_PLATFORM_WEBSITE_ID` is configured.

Do not enable:

- autocapture of arbitrary form fields;
- session recording without separate consent/review;
- advertising retargeting;
- raw email/user identifiers as analytics distinct IDs.
- Umami tracking on Behind or public artist pages without a separate product and
  privacy review.

## Required Scope Review Triggers

A new review is mandatory before:

- adding any OAuth flow;
- adding any write scope;
- adding Google/YouTube authorized-data access;
- adding Shopify Admin API or inbound webhooks;
- adding Printful/Printify order creation;
- adding a new email/support/chat provider;
- enabling session replay, heatmaps, ad pixels, or marketing pixels;
- embedding providers that set cookies before user interaction.

## Validation Checklist

- [ ] Current production env values match this scope review.
- [ ] Public policies disclose active providers only.
- [ ] Provider credentials are environment-specific.
- [ ] Token disconnect deletes local encrypted tokens.
- [ ] OAuth revocation exists before any OAuth provider ships.
- [ ] No provider is granted future/unbuilt scopes.
- [ ] Provider policy evidence is captured in the evidence register.
