# Providers and International Transfers

Status: initial provider map. Contracts, DPAs, SCCs, and region settings require
business/legal confirmation.

## Provider Inventory

| Provider                 | Purpose                                     | Data potentially processed                                     | Role assumption                                                                                                 | Review need                                                                |
| ------------------------ | ------------------------------------------- | -------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| WorkOS AuthKit           | Authentication, sessions, user identity     | Email, name, auth events, sessions, security signals           | Processor/subprocessor for StageLink auth; independent controller for limited security/legal purposes may apply | Confirm DPA, regions, session retention, MFA/Radar posture                 |
| Stripe                   | Payments, subscriptions, invoices, webhooks | Billing identifiers, customer/payment data, subscription state | Payment processor / independent controller for payment compliance                                               | Confirm Stripe DPA, tax retention, receipt data                            |
| Vercel                   | Web hosting, logs, env vars                 | Request metadata, deployment logs, env vars                    | Processor                                                                                                       | Confirm DPA, log retention, preview deployment access                      |
| Railway                  | API/database hosting                        | App data, DB, logs, env vars                                   | Processor                                                                                                       | Confirm DPA, region, backups plan, log retention                           |
| PostgreSQL/Railway DB    | Primary data store                          | All application data                                           | Processor infrastructure                                                                                        | Confirm backup/restore controls and retention                              |
| S3/R2-compatible storage | Uploaded assets                             | Images, object keys, file metadata                             | Processor                                                                                                       | Confirm bucket region, public/private access, retention, deletion behavior |
| PostHog                  | Product analytics                           | Product events, pseudonymous IDs, page events                  | Processor/subprocessor if configured as service provider                                                        | Confirm EU/US hosting, data retention, IP handling, DPA                    |
| Umami                    | Possible analytics                          | Web analytics                                                  | Processor if used                                                                                               | Confirm whether active at launch                                           |
| Upstash Redis            | Rate limiting/cache                         | IP/request counters or pseudonymous abuse metadata             | Processor                                                                                                       | Confirm whether used in production, region, TTLs                           |
| Resend/EmailJS           | Transactional/contact emails                | Sender/recipient email, message content, delivery metadata     | Processor                                                                                                       | Confirm final provider, DPA, retention, abuse controls                     |
| Spotify                  | Artist insights/reference data              | External artist profile, metrics, OAuth data if used           | Independent controller/provider                                                                                 | Confirm API terms, OAuth scopes, deletion/disconnect                       |
| YouTube/Google           | Artist insights/reference data              | Channel identifiers, metrics, OAuth data if used               | Independent controller/provider                                                                                 | Confirm API Services policies, scopes, retention                           |
| SoundCloud               | Artist insights/reference data              | Profile/metrics/OAuth or reference data                        | Independent controller/provider                                                                                 | Confirm API terms and scopes                                               |
| Shopify                  | Storefront/merch integration                | Store domain, product handles, storefront token                | Independent controller/provider                                                                                 | Confirm API terms and storefront token exposure rules                      |
| Printful/Printify        | Merch provider integration                  | API token, store ID/name, product data                         | Independent controller/provider                                                                                 | Confirm whether active at launch and data deletion                         |
| GitHub Actions           | CI/CD                                       | Build logs, secrets references                                 | Processor/tooling                                                                                               | Confirm secrets masking and least privilege                                |

## International Transfer Position

StageLink should assume international transfers occur because the product uses
global cloud, auth, analytics, payment, and storage providers. The Privacy Policy
should disclose:

- Data may be processed outside the user's country.
- Provider safeguards may include DPAs, Standard Contractual Clauses, and
  comparable transfer mechanisms.
- Users may have local rights that continue to apply despite transfers.

## Transfer Review Checklist

Before public launch:

- Confirm StageLink operating entity and export/import role.
- Collect provider DPA links or signed agreements.
- Confirm whether each provider offers SCCs or equivalent transfer terms.
- Confirm production regions for database, storage, analytics, auth, and email.
- Confirm whether PostHog is EU-hosted or US-hosted.
- Confirm whether any provider receives data for advertising or model training.
- Document whether StageLink sells or shares personal information under
  CCPA/CPRA definitions. Current product intent: no sale of personal data.

## High-Risk Transfer Areas

- Product analytics and tracking tools if configured with broad identifiers.
- OAuth integrations that may involve Google/YouTube data.
- Email providers because message content can contain personal data.
- Asset storage/CDN because public media may include identifiable likenesses.
- Logs if they include IPs, emails, tokens, or request payload fragments.
