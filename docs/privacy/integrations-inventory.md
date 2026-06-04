# Third-Party Integrations Inventory

Status: Privacy Plan - third-party and integrations baseline.
Date: 2026-05-14

This inventory reflects the current StageLink repository and operational docs.
It intentionally separates active production dependencies from planned or
configurable integrations so the privacy program does not overstate compliance
or claim provider controls StageLink has not verified.

## Inventory Summary

| Provider                   | Status                                                     | Product area                                             | Data sent by StageLink                                                    | Data received by StageLink                               | Stored locally                                         | Role posture                                                                                          | Risk   |
| -------------------------- | ---------------------------------------------------------- | -------------------------------------------------------- | ------------------------------------------------------------------------- | -------------------------------------------------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------- | ------ |
| WorkOS AuthKit             | Active                                                     | Authentication, sessions, Radar                          | redirect/callback metadata, user auth requests, session/security metadata | user identity, session/JWT claims, auth events           | WorkOS user id, email, local user profile              | Processor for StageLink auth; independent controller for limited security/legal purposes              | High   |
| Railway                    | Active                                                     | API hosting, PostgreSQL, runtime logs                    | app code, env vars, DB traffic, logs                                      | hosting/runtime services                                 | primary app DB and logs                                | Processor                                                                                             | High   |
| Vercel                     | Active                                                     | Next.js web hosting, API routes, CDN, deployment logs    | web requests, env vars, build/deployment data, logs                       | rendered web app, edge/runtime services                  | web logs/artifacts                                     | Processor                                                                                             | High   |
| Railway PostgreSQL         | Active                                                     | Primary database                                         | all core application records                                              | query results                                            | all core StageLink data                                | Infrastructure processor                                                                              | High   |
| S3/R2-compatible storage   | Active                                                     | Uploads/assets                                           | uploaded files, object metadata                                           | presigned upload/download behavior                       | object keys, metadata, delivery URLs                   | Processor                                                                                             | High   |
| Stripe                     | Active                                                     | Billing, checkout, portal, webhooks                      | customer/email metadata, price/checkout requests, subscription references | customer/subscription/webhook state                      | Stripe ids, subscription state, webhook event ids      | Payment processor/independent controller for regulated payment obligations                            | High   |
| PostHog                    | Active if env set                                          | Product analytics                                        | consent-gated product events, pseudonymous ids                            | analytics dashboards/events                              | analytics event copies in provider                     | Processor if configured under DPA/service-provider terms                                              | High   |
| Umami                      | Active for StageLink Platform when public env vars are set | Product and growth analytics                             | Consent-gated platform pageviews, UTM parameters, and `auth_*` events     | analytics dashboards/events                              | analytics event copies in provider                     | Processor if configured under DPA/service-provider terms                                              | Medium |
| Upstash Redis              | Active for Behind/admin roles if env set                   | Behind role management, possible future rate limit store | admin-role keys, email-role mapping, request counters if expanded         | role lookup results                                      | Redis role map/counters                                | Processor                                                                                             | Medium |
| Resend                     | Active if `RESEND_API_KEY` set                             | Landing contact email                                    | sender name/email, artist type, message, recipient metadata               | delivery result                                          | not stored locally by current contact route            | Processor                                                                                             | Medium |
| EmailJS                    | Active if public env set                                   | Public artist contact form                               | visitor name/email/message, recipient email, template metadata            | send status                                              | not stored locally by current client component         | Processor/vendor; browser-side exposure                                                               | High   |
| Spotify                    | Active if env set                                          | Artist insights                                          | client credentials auth request, artist id/reference                      | public artist profile, followers, popularity, top tracks | external ids, metrics snapshots                        | Independent provider; StageLink is controller of imported copy                                        | Medium |
| YouTube/Google             | Active if env set                                          | Artist insights                                          | API key request, channel id/handle                                        | public channel stats, recent videos                      | external ids, metrics snapshots                        | Independent provider; StageLink is controller of imported copy                                        | High   |
| SoundCloud                 | Active if env set                                          | Artist insights                                          | `client_id`, profile URL/account id                                       | public profile, follower/track metrics, top tracks       | external ids, metrics snapshots                        | Independent provider; SoundCloud API terms treat API user as independent controller for personal data | High   |
| Shopify Storefront         | Active/configurable                                        | Storefront/merch blocks                                  | store domain, Storefront token, product/collection handles                | shop name, collection/product data                       | encrypted Storefront token, store/product selections   | Independent provider/controller; StageLink controls imported display copy                             | Medium |
| Printful                   | Active/configurable                                        | Smart merch                                              | encrypted API token, optional store id, product ids                       | store summary, product data                              | encrypted API token, store metadata/product selections | Independent provider/controller; StageLink controls imported display copy                             | Medium |
| Printify                   | Schema/planned                                             | Smart merch                                              | none currently; provider enum exists                                      | none currently                                           | possible future token fields                           | Future provider                                                                                       | Medium |
| GitHub Actions             | Active                                                     | CI/CD                                                    | source code, logs, artifacts, masked secret references                    | CI results/artifacts                                     | workflow logs/artifacts                                | Processor/tooling                                                                                     | Medium |
| Browser/device storage     | Active                                                     | Consent/auth/local UX                                    | cookies, localStorage/sessionStorage values                               | persisted browser state                                  | user device                                            | User-controlled storage; StageLink controller for values it sets                                      | Medium |
| Public social/media embeds | Active                                                     | Public pages/EPK blocks                                  | browser requests to providers when embeds load                            | embedded media/content                                   | provider-side logs/cookies                             | Provider is independent controller for embed traffic                                                  | High   |

## Active Integration Classes

### Authentication and Account Management

- WorkOS owns hosted authentication, AuthKit sessions, Radar challenges, and
  password/social/magic-auth handling.
- StageLink receives a WorkOS-authenticated identity and stores only the local
  user/account fields needed to operate the platform.
- Provider-side deletion and session revocation remain operational runbook
  items for DSAR/account deletion.

### Billing and Payment

- Stripe owns payment method collection, checkout, customer portal, invoices,
  subscriptions, tax/fraud obligations, and payment-retention obligations.
- StageLink stores Stripe identifiers and subscription state, not card data.
- Stripe webhook event ids are stored for idempotency and must not be deleted
  prematurely if they are needed to reconcile subscription state.

### Analytics and Tracking

- PostHog browser analytics is consent-gated by the StageLink consent system.
- PostHog server-side analytics is disabled when `POSTHOG_KEY` is absent.
- Umami is mounted on StageLink Platform routes and remains excluded from Behind
  and public artist pages in v1.
- Public artist page analytics and SmartLink analytics are local StageLink
  processing and still need retention enforcement.

### Music and Platform Insights

- Spotify currently uses Client Credentials. This avoids user OAuth tokens for
  current artist-reference insights.
- YouTube currently uses a Data API key and public channel data. If owner-only
  YouTube Analytics is added later, Google OAuth, verification, scope review,
  revocation, and API-data deletion obligations become much stricter.
- SoundCloud currently uses `client_id` with public API v2 endpoints. This is
  operationally and policy fragile because the code documents that the API v2
  surface is not formally documented for stable third-party server use.

### Commerce and Merch

- Shopify Storefront integration stores an encrypted Storefront token per
  artist, store domain, and selected collection/product handles.
- Printful stores an encrypted API token per artist and retrieves product
  previews/selections.
- Printify appears as an enum/future provider but throws "not implemented" in
  the current service.

### Email and Contact

- The landing contact route sends validated messages through Resend.
- The public artist contact-form block uses EmailJS from the browser when the
  EmailJS public env values are configured.
- Both flows process visitor email/message content and must be disclosed as
  contact/support communications. The current public artist contact path does
  not store messages in StageLink DB.

## Hidden or Indirect Processors

These are not necessarily directly contracted by StageLink in every case, but
they can process personal data through the selected providers:

- Vercel subprocessors/CDN/security providers.
- Railway subprocessors and infrastructure providers.
- WorkOS subprocessors for auth delivery, security, and operational support.
- Stripe subprocessors for payments, fraud, financial compliance, and support.
- PostHog subprocessors and hosting region/provider.
- Resend and EmailJS email delivery subprocessors.
- Object-storage provider/CDN subprocessors.
- Shopify/Printful/Printify subprocessors when artists connect those services.

## Launch Decisions

| Decision        | Current posture                                                                                | Required before public launch                                                       |
| --------------- | ---------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| Analytics stack | PostHog active if configured; Umami active for StageLink Platform when public env vars are set | Confirm provider regions, retention, IP handling, and public policy wording         |
| SoundCloud      | Works through `client_id`/API v2 style requests                                                | Confirm policy acceptance or downgrade to artist-provided public links/embeds only  |
| YouTube         | API-key public data only today                                                                 | Avoid OAuth scopes until owner-only features require them                           |
| Email/contact   | Resend landing + EmailJS public contact block                                                  | Confirm final provider(s), DPA, retention, and public disclosure                    |
| Provider DPAs   | Not fully evidenced in repo                                                                    | Build provider evidence register with DPA/SCC/region/subprocessor links             |
| Object storage  | S3/R2-compatible                                                                               | Confirm provider, region, lifecycle rules, public/private access, deletion behavior |

## Maintenance Rule

Any new provider, embedded widget, API credential, OAuth scope, or data-sharing
workflow must update this file, `provider-compliance-matrix.md`,
`external-data-flows.md`, and the public policy drafts before production use.
