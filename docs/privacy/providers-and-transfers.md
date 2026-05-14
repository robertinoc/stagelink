# Providers and International Transfers

Status: initial provider map. Contracts, DPAs, SCCs, and region settings require
business/legal confirmation.

See also:

- `international-transfer-impact-assessment.md` for transfer mechanism
  selection, supplementary measures, and provider transfer questions.
- `provider-compliance-matrix.md` for evidence fields that must be completed
  before public launch.

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
| Resend                   | Landing contact emails                      | Sender/recipient email, message content, delivery metadata     | Processor                                                                                                       | Confirm DPA, retention, abuse controls                                     |
| EmailJS                  | Public artist contact-form emails           | Visitor email/message, destination email, browser metadata     | Processor/vendor; browser-side                                                                                  | Confirm DPA, retention, subprocessors, or replace with server-side email   |
| Spotify                  | Artist insights/reference data              | External artist profile, metrics, app client-credentials flow  | Independent controller/provider                                                                                 | Confirm API terms, public-data usage, deletion/disconnect                  |
| YouTube/Google           | Artist insights/reference data              | Channel identifiers, public metrics via API key                | Independent controller/provider                                                                                 | Confirm API Services policies, avoid OAuth without separate review         |
| SoundCloud               | Artist insights/reference data              | Profile/metrics through API v2 `client_id` requests            | Independent controller/provider                                                                                 | Confirm official API posture before public launch                          |
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

StageLink should not rely on a generic statement that a provider is "US-based"
or "EU-hosted" as a transfer mechanism. For every active provider, record:

- exact provider legal entity;
- production data/log region;
- DPA or equivalent processor terms;
- Standard Contractual Clauses, UK/Swiss addendum, adequacy decision, or
  verified EU-US Data Privacy Framework certification where applicable;
- subprocessor list and update-notice process;
- provider deletion/DSAR assistance path;
- retention settings for product data, logs, backups, artifacts, and support
  tickets.

Use Article 49 derogations only for exceptional, non-routine transfers. Routine
cloud, auth, analytics, payment, email, storage, and CI/CD processing should use
provider transfer terms, adequacy/DPF evidence where applicable, and
supplementary measures.

## Transfer Review Checklist

Before public launch:

- Confirm StageLink operating entity and export/import role.
- Collect provider DPA links or signed agreements.
- Confirm whether each provider offers SCCs or equivalent transfer terms.
- Confirm whether each US provider is covered by the EU-US Data Privacy
  Framework only after verifying the exact entity and certification scope.
- Confirm UK and Swiss transfer addenda where StageLink serves users in those
  jurisdictions.
- Confirm production regions for database, storage, analytics, auth, and email.
- Confirm whether PostHog is EU-hosted or US-hosted.
- Confirm whether any provider receives data for advertising or model training.
- Document whether StageLink sells or shares personal information under
  CCPA/CPRA definitions. Current product intent: no sale of personal data.
- Capture EmailJS, SoundCloud, object-storage, and PostHog decisions before
  public launch.

## High-Risk Transfer Areas

- Product analytics and tracking tools if configured with broad identifiers.
- OAuth integrations that may involve Google/YouTube data.
- Email providers because message content can contain personal data.
- Asset storage/CDN because public media may include identifiable likenesses.
- Logs if they include IPs, emails, tokens, or request payload fragments.
- Public embeds because the visitor browser may contact third-party providers
  directly before or during media rendering.
