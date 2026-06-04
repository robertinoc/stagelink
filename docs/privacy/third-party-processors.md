# StageLink Third-Party Processor Inventory

Status: Privacy Plan data-mapping baseline.
Date: 2026-05-14

This document focuses on operational data processing. Contracts, DPAs, SCCs,
regions, and legal role language require final legal/business confirmation.

International transfer evidence is tracked in
`international-transfer-impact-assessment.md` and `provider-compliance-matrix.md`.
Treat "international transfer likely" as the default until the active provider's
region, DPA, SCC/DPF/adequacy posture, subprocessor list, retention settings,
and deletion support path are recorded.

## Processor and Provider Matrix

| Provider              | StageLink use                                                          | Data processed                                                                       | Role assumption                                                                    | Transfer/region notes                                                  | Launch status                                    |
| --------------------- | ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------- | ---------------------------------------------------------------------- | ------------------------------------------------ |
| WorkOS AuthKit        | Authentication, sessions, hosted login, Radar/bot/brute-force controls | email, name, auth methods, session/security metadata, login events                   | Processor for StageLink auth; may act independently for security/legal obligations | International transfer likely; confirm DPA and region                  | Active                                           |
| Railway               | API hosting and PostgreSQL database                                    | app database, API logs, env vars, deployment data                                    | Processor                                                                          | Region/backups/log retention need confirmation                         | Active                                           |
| Vercel                | Next.js hosting, public web runtime, edge/CDN/logs                     | request metadata, deployment logs, env vars, public page responses                   | Processor                                                                          | Region/log retention need confirmation                                 | Active                                           |
| PostgreSQL on Railway | Primary app system of record                                           | all core app records                                                                 | Infrastructure processor                                                           | Backups disabled on Hobby plan                                         | Active                                           |
| S3-compatible storage | Media uploads and public asset delivery                                | images, object keys, file metadata, delivery URLs                                    | Processor                                                                          | Bucket region, public/private ACL, deletion behavior need confirmation | Active/required                                  |
| Stripe                | Checkout, Portal, subscriptions, webhooks                              | payment/customer/subscription data, invoices, tax/fraud data, metadata               | Payment processor / independent controller for regulated payment obligations       | Stripe international transfer terms apply                              | Active                                           |
| PostHog               | Product analytics after consent                                        | product events, identifiers, properties, page/product usage                          | Processor if configured as service provider                                        | EU/US hosting and retention must be confirmed                          | Active/consent-gated                             |
| Umami                 | StageLink Platform analytics when configured                           | Consent-gated platform page views, UTM parameters, and `auth_*` events               | Processor if configured as service provider                                        | Region, DPA, retention, and IP handling need confirmation              | Active for platform when public env vars are set |
| Upstash Redis         | Rate limiting/abuse counters if configured                             | IP/request counters, pseudonymous abuse metadata                                     | Processor                                                                          | Region and TTLs need confirmation                                      | Optional/decision pending                        |
| Resend                | Landing contact email delivery                                         | names, emails, message content, recipient/sender metadata                            | Processor                                                                          | DPA/retention need confirmation                                        | Active if `RESEND_API_KEY` set                   |
| EmailJS               | Public artist contact-form delivery                                    | visitor name/email/message, artist destination email, browser delivery metadata      | Processor/vendor; browser-side exposure                                            | DPA/retention/subprocessors need confirmation                          | Active if `NEXT_PUBLIC_EMAILJS_*` set            |
| Spotify               | Artist insights/reference validation                                   | artist profile/reference/metrics; no user OAuth in current implementation            | Independent provider/controller; StageLink receives public provider data           | API terms and scopes need review                                       | Active/reference/sync                            |
| YouTube/Google        | Artist insights/reference validation                                   | channel identifiers, public channel metrics; no user OAuth in current implementation | Independent provider/controller                                                    | Google/YouTube API Services policies and transfer terms apply          | Active/reference/sync                            |
| SoundCloud            | Artist insights/reference validation                                   | profile/metrics from API v2 `client_id` requests                                     | Independent provider/controller                                                    | Official API/terms posture needs confirmation                          | Active/reference/sync; launch decision needed    |
| Shopify               | Storefront/merch integration                                           | store domain, storefront token, product/collection handles                           | Independent provider/controller; token processor relationship depends setup        | Shopify API terms apply                                                | Active/configurable                              |
| Printful/Printify     | Merch provider integration                                             | API token, store metadata, products                                                  | Independent provider/controller                                                    | Terms and token handling need review                                   | Configurable/future                              |
| GitHub Actions        | CI/CD, artifacts, logs                                                 | build logs, test screenshots/videos, masked secret references                        | Processor/tooling                                                                  | Artifacts can retain private screenshots                               | Active                                           |

## Provider Risk Notes

### WorkOS

Critical because it is the authentication authority. StageLink must document:

- environment separation for staging/production;
- callback/redirect allowlist;
- Radar policies;
- MFA posture;
- session lifetime;
- provider-side deletion/revocation process for erasure requests.

### Stripe

Critical for financial data. StageLink should not delete records required for
legal/tax/payment dispute purposes. Public policy should explain that payment
data is processed by Stripe and may be retained by Stripe as required by law.

### Railway and Vercel

Critical infrastructure processors. Required confirmations:

- production region;
- log retention;
- staff/admin access controls;
- environment variable access;
- backup status and retention.

### PostHog/Umami

High privacy risk because analytics can become behavioral profiling if expanded.
Current rule:

- do not initialize public/artist-facing analytics before consent;
- keep Umami scoped to StageLink Platform product/growth analytics, with Behind as viewer only;
- do not send PII or artist-specific performance data to Umami;
- do not use analytics providers for advertising/retargeting without explicit
  marketing consent and policy updates;
- configure retention before public scale.

### Provider APIs

Spotify, YouTube/Google, SoundCloud, Shopify, Printful, and Printify are not
simple subprocessors in all contexts. They may be independent controllers for
their own services while StageLink receives user-authorized data. StageLink
must avoid claiming provider-side deletion/control it does not have.

Current scope decisions:

- Spotify uses Client Credentials and public artist data; no user Spotify OAuth
  scopes are active.
- YouTube uses API-key public channel data; owner-only YouTube OAuth is not part
  of the launch baseline.
- SoundCloud server-side sync needs explicit launch acceptance because the
  current API v2 usage is operationally fragile.
- Shopify must remain Storefront read-only unless a new Admin API scope review
  is completed.
- Printful is read-oriented today; Printify/order/customer scopes require a new
  review before activation.
- EmailJS must be either accepted as a reviewed browser-side email provider or
  replaced by a server-side email path.

## Missing Contract/Configuration Evidence

Before launch checklist:

- DPA/SCC links or signed terms for WorkOS, Vercel, Railway, PostHog, Resend,
  storage, Upstash if used.
- Exact transfer mechanism per active provider, including SCC module,
  adequacy/DPF certification if relied on, and UK/Swiss addenda where
  applicable.
- Stripe payment/legal retention position.
- Provider regions for DB, logs, storage, analytics, email.
- Confirmation of Umami Cloud/self-hosted region, DPA/SCC posture, retention,
  IP handling, DNT behavior, and deletion/export support for Behind analytics.
- Confirmation whether PostHog is EU-hosted or US-hosted.
- Confirmation that no provider receives data for advertising/model-training
  purposes without explicit opt-in and disclosure.
- Confirmation that active providers match `integrations-inventory.md` and
  public policies disclose active providers only.
- Confirmation whether EmailJS remains in production public contact forms.
- Confirmation whether SoundCloud server-side insights are launch-approved.

## Subprocessor Update Rule

Any new provider must be added here before production use, including:

- purpose;
- data categories;
- role assumption;
- region/transfer implications;
- retention/deletion behavior;
- owner/team responsible;
- public-policy disclosure requirement.
