# Provider Compliance Matrix

Status: Privacy Plan - third-party and integrations baseline.
Date: 2026-05-14

This matrix is an operational register. It does not replace signed DPAs,
contract review, transfer impact assessment, or counsel review. "Evidence
needed" means the provider should not be treated as fully launch-cleared until
StageLink stores the relevant DPA, SCC/transfer mechanism, region, retention,
subprocessor, and supplementary-measure evidence.

## Matrix

| Provider                 | StageLink dependency         | Data processed                                                         | Role posture                                                               | GDPR/DPA evidence                                            | SCC/transfer evidence                 | Risk   | Launch action                                                              |
| ------------------------ | ---------------------------- | ---------------------------------------------------------------------- | -------------------------------------------------------------------------- | ------------------------------------------------------------ | ------------------------------------- | ------ | -------------------------------------------------------------------------- |
| WorkOS                   | Auth/session/Radar           | identity, sessions, auth/security events                               | Processor for auth; independent security/legal role may apply              | WorkOS legal policies/DPA/subprocessors to confirm           | Confirm region/transfers              | High   | Add evidence link, region, retention, Radar/MFA posture                    |
| Vercel                   | Web hosting/CDN/logs         | request metadata, logs, env vars, deployment artifacts                 | Processor for customer data; controller for contact/service-generated data | Vercel DPA available for Pro/Enterprise per current DPA page | DPA references SCCs/subprocessors     | High   | Confirm plan coverage, log retention, preview auth posture                 |
| Railway                  | API/DB hosting/logs          | app DB, logs, env vars                                                 | Processor                                                                  | Railway DPA available                                        | DPA references SCCs and subprocessors | High   | Confirm plan/entity, region, backups, log retention                        |
| Stripe                   | Billing/payments             | customer/payment/subscription/tax/fraud data                           | Processor/independent controller for payment/legal obligations             | Stripe DPA/legal terms available                             | Confirm Stripe transfer terms         | High   | Confirm account country, tax/retention, webhook env separation             |
| PostHog                  | Analytics                    | product events/pseudonymous ids                                        | Processor if configured under DPA                                          | PostHog DPA/subprocessors to confirm                         | Confirm EU/US project region          | High   | Confirm project region, retention, IP handling, autocapture off            |
| Umami                    | StageLink Platform analytics | Consent-gated platform page views, UTM parameters, `platform_*` events | Processor if configured under DPA/service-provider terms                   | Evidence needed for active platform setup                    | Confirm region/transfers              | Medium | Confirm Cloud/self-host region, DPA, retention, IP handling, DNT behavior  |
| Resend                   | Landing contact email        | sender/recipient email, message content, delivery metadata             | Processor                                                                  | Resend legal/DPA/subprocessors available                     | Confirm transfer terms                | Medium | Confirm DPA, retention, sender domain, abuse handling                      |
| EmailJS                  | Public artist contact form   | visitor email/message, destination email, browser metadata             | Processor/vendor; browser-side                                             | Evidence needed                                              | Evidence needed                       | High   | Confirm DPA/terms or replace with server-side email path                   |
| Upstash Redis            | Behind roles/rate counters   | admin email-role mapping, possible request counters                    | Processor                                                                  | Evidence needed                                              | Evidence needed                       | Medium | Confirm region/TTL and role-data retention                                 |
| S3/R2-compatible storage | Uploaded assets              | media files, metadata, object keys                                     | Processor                                                                  | Depends on selected provider                                 | Depends on selected provider          | High   | Confirm provider, region, DPA, lifecycle/deletion behavior                 |
| Spotify                  | Public artist insights       | artist metadata, metrics, top tracks                                   | Independent provider; StageLink controls imported copy                     | Developer terms/policy apply                                 | Provider terms apply                  | Medium | Keep Client Credentials only; add disconnect/delete disclosure             |
| YouTube/Google           | Public channel insights      | channel metadata/stats/recent video metadata                           | Independent provider; StageLink controls imported copy                     | YouTube/Google API policies apply                            | Provider terms apply                  | High   | Avoid OAuth at launch; add disclosures and no undocumented APIs            |
| SoundCloud               | Public profile insights      | profile, followers/track metrics, top tracks                           | Independent controller relationship under API terms                        | API terms apply; official access posture needs confirmation  | Provider terms apply                  | High   | Confirm official API use or downgrade to public links/embeds               |
| Shopify                  | Storefront merch block       | store domain, token, products, collections                             | Independent provider/controller; token processor implications depend setup | Shopify legal/API terms to confirm                           | Provider terms apply                  | Medium | Use Storefront read only; no Admin API; disclose checkout leaves StageLink |
| Printful                 | Smart merch                  | API token, store metadata, products                                    | Independent provider/controller                                            | Evidence needed                                              | Provider terms apply                  | Medium | Confirm token scope/terms; no orders/customer data at launch               |
| Printify                 | Future smart merch           | none active                                                            | Future provider                                                            | Not applicable until enabled                                 | Not applicable                        | Medium | Review before implementation                                               |
| GitHub Actions           | CI/CD                        | logs/artifacts/secret refs                                             | Processor/tooling                                                          | GitHub legal/security terms                                  | Provider terms apply                  | Medium | Keep artifacts privacy-safe and short-lived                                |

## Evidence Register Fields

For each active provider, StageLink should keep a lightweight evidence record:

- provider legal name;
- StageLink account owner;
- plan/tier;
- DPA URL or signed DPA location;
- subprocessor list URL;
- SCC/international transfer mechanism;
- EU-US Data Privacy Framework certification check, if relied on;
- UK IDTA/addendum and Swiss transfer term status, if applicable;
- production data region;
- support/log/subprocessor access countries if the provider exposes them;
- log/data retention period;
- backup/artifact/support-ticket retention period where applicable;
- security contact or incident notice channel;
- data deletion/DSAR support path;
- supplementary technical measures, such as encryption, access controls,
  log minimization, token handling, or region restrictions;
- last reviewed date;
- next review date;
- owner responsible for re-review.

## Provider Sources Reviewed

- Spotify Developer Policy: https://developer.spotify.com/policy
- Spotify Developer Terms: https://developer.spotify.com/terms
- YouTube API Services Developer Policies:
  https://developers.google.com/youtube/terms/developer-policies
- Google API Services User Data Policy:
  https://developers.google.com/terms/api-services-user-data-policy
- SoundCloud API Terms of Use:
  https://developers.soundcloud.com/docs/api/terms-of-use
- Stripe Data Processing Agreement: https://stripe.com/legal/dpa
- Vercel Data Processing Addendum: https://vercel.com/legal/dpa
- Railway Data Processing Addendum: https://railway.com/legal/dpa
- Resend Legal/DPA page: https://resend.com/legal
- Shopify DPA/API legal pages: https://www.shopify.com/legal/dpa

## Launch Blockers

These are not code blockers for private QA, but they are privacy launch blockers
for public scale:

1. Evidence register is incomplete for active processors.
2. EmailJS provider posture is not fully reviewed despite processing public
   contact-form message content.
3. SoundCloud official API posture is not fully evidenced.
4. Object storage provider, region, lifecycle, and DPA are not captured.
5. PostHog region/retention settings are not captured.
6. Exact DPF certification status, if StageLink intends to rely on DPF for any
   US provider, is not captured.
7. UK/Swiss transfer addendum posture is not captured.

## Review Cadence

- Review active providers before public launch.
- Re-review quarterly during active launch iteration.
- Re-review immediately after any new integration, OAuth scope, embed provider,
  analytics provider, email provider, or storage provider change.
