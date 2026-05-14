# International Transfer Impact Assessment

Status: Privacy Plan - international data transfer baseline.
Date: 2026-05-14

This document is an engineering and operations baseline for international
personal-data transfers in StageLink. It is not legal advice and does not
replace signed contracts, DPAs, Standard Contractual Clauses, Transfer Impact
Assessments, or counsel review.

## Executive Position

StageLink should assume international transfers occur in normal production use.
Even when StageLink stores primary app records in a selected cloud region,
personal data can move through global providers for authentication, hosting,
payments, analytics, email, storage, support, logs, CI/CD, public embeds, and
artist-configured integrations.

Launch posture:

- Do not describe StageLink as region-locked or transfer-free.
- Do not claim a provider is launch-cleared until the evidence register has the
  provider's DPA, transfer mechanism, region, retention, deletion path, and
  subprocessor reference.
- Treat SCCs, adequacy decisions, Data Privacy Framework certification, and
  provider transfer terms as evidence inputs, not assumptions.
- Keep optional analytics, marketing, session replay, advertising pixels, and
  provider OAuth scopes disabled unless transfer review is repeated.

## Transfer Source and Destination Model

| Source context                                | Exporter posture                                                                                            | Typical destination                                                                   | Importer posture                                       | Transfer likelihood |
| --------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- | ------------------------------------------------------ | ------------------- |
| EEA/UK/Swiss visitor using public artist page | StageLink as controller for platform processing; artist may be controller for public content/contact intake | Vercel/CDN, PostHog if consented, embed providers, EmailJS/Resend when forms are used | Processor or independent provider depending provider   | High                |
| EEA/UK/Swiss artist account                   | StageLink as controller for account/platform data; possible processor for artist fan/subscriber data        | WorkOS, Railway, Vercel, Stripe, storage, PostHog, integration APIs                   | Processor or independent controller depending provider | High                |
| Argentina or LATAM artist/visitor             | StageLink as controller/platform operator                                                                   | US/EU/global cloud and SaaS providers                                                 | Processor or independent provider                      | High                |
| US artist/visitor                             | StageLink as controller/platform operator                                                                   | US/EU/global cloud and SaaS providers                                                 | Processor or independent provider                      | Medium              |
| CI/CD and support operations                  | StageLink as controller/operator                                                                            | GitHub, Vercel, Railway, support inbox/tools                                          | Processor/tooling                                      | Medium              |

## Transfer Mechanism Decision Tree

Use this order for each active provider:

1. Adequacy decision
   - If the destination country has an applicable adequacy decision for the
     data and recipient, record it.
   - For US recipients, do not rely on the EU-US Data Privacy Framework unless
     the specific recipient entity is certified for the relevant data category.
2. Standard Contractual Clauses or equivalent provider transfer terms
   - Record the DPA/SCC module or provider terms that apply.
   - Confirm whether the provider is processor, controller, or both in the
     relevant context.
3. Transfer Impact Assessment and supplementary measures
   - Assess destination-country access risk, provider transparency, encryption,
     access controls, minimization, logging, and deletion controls.
   - Add supplementary measures where SCCs alone are not enough.
4. Article 49 derogations
   - Use only for exceptional, non-routine transfers.
   - Do not use consent or contract necessity as the default for routine
     production SaaS infrastructure.

## Provider Transfer Register

| Provider                 | Transfer category                               | Expected transfer mechanism                                                        | Supplementary controls                                                                                         | Current status                         |
| ------------------------ | ----------------------------------------------- | ---------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | -------------------------------------- |
| WorkOS                   | Auth identity, sessions, security events        | DPA/SCCs or equivalent transfer terms; DPF only if entity-certified and applicable | Server-only secrets, redirect allowlist, no token logging, provider deletion/revocation runbook                | Evidence incomplete                    |
| Vercel                   | Web runtime, CDN, logs, deployment metadata     | DPA/SCCs; region/log configuration evidence                                        | Minimize logs, avoid secret leakage, protect preview deployments, short artifact retention                     | Evidence incomplete                    |
| Railway                  | API, PostgreSQL, app logs, env vars             | DPA/SCCs; selected production region evidence                                      | Least-privilege env access, backup controls, log minimization, retention candidate reporting                   | Evidence incomplete                    |
| PostgreSQL on Railway    | Primary app records                             | Same as Railway                                                                    | App-level tenant checks, encryption at rest by provider, retention/delete workflows                            | Evidence incomplete                    |
| S3/R2-compatible storage | Uploaded media, object metadata, delivery URLs  | Provider-specific DPA/SCCs or adequacy                                             | Tenant-scoped object keys, presigned uploads, deletion/orphan checks, lifecycle rules                          | Provider not finalized in evidence     |
| Stripe                   | Billing, subscription, invoice, fraud/tax data  | Stripe DPA/transfer terms; possible independent controller obligations             | No card collection in StageLink, signed webhooks, data minimization, retained references for legal obligations | Evidence incomplete                    |
| PostHog                  | Consent-gated analytics events                  | DPA/SCCs; EU/US project region evidence                                            | Consent gate, autocapture off unless reviewed, no raw email/tokens/payment/message content, retention settings | Evidence incomplete                    |
| Resend                   | Contact/transactional email                     | DPA/SCCs or equivalent transfer terms                                              | Rate limiting, escaped HTML output, no unnecessary local message storage, provider retention review            | Evidence incomplete                    |
| EmailJS                  | Public artist contact messages from browser     | DPA/SCCs or replacement with server-side reviewed email path                       | Treat browser keys as public, disclose provider, confirm retention/subprocessors, consider migration           | High risk/evidence incomplete          |
| Upstash Redis            | Rate limiting/cache/role metadata if used       | DPA/SCCs and region evidence                                                       | TTLs, avoid payload storage, classify admin role metadata                                                      | Optional/evidence incomplete           |
| Spotify                  | Public artist reference/metrics                 | Provider terms; independent provider                                               | Client Credentials only, no user OAuth, delete local imported copy on disconnect/erasure                       | Terms review needed                    |
| YouTube/Google           | Public channel reference/metrics                | Google/YouTube API terms; DPF/SCC only if applicable to recipient relationship     | API-key public data only, no owner OAuth without separate revocation/deletion review                           | Terms review needed                    |
| SoundCloud               | Public profile/metrics                          | Provider API terms                                                                 | No scraping, disable or downgrade if official API posture is not confirmed                                     | Launch decision needed                 |
| Shopify                  | Storefront products/links                       | Shopify terms/DPA depending context                                                | Storefront read-only, no Admin API, checkout remains on Shopify, token deletion on disconnect                  | Terms review needed                    |
| Printful/Printify        | Merch provider tokens/products                  | Provider terms/DPA depending activation                                            | Read-only launch scope, no order/customer scopes without new review                                            | Printful configurable; Printify future |
| GitHub Actions           | Build logs, artifacts, masked secret references | GitHub terms/DPA where applicable                                                  | No real personal data in artifacts, short retention, masked secrets, environment-scoped secrets                | Evidence incomplete                    |

## Supplementary Measures Baseline

### Technical Measures

- TLS for all browser, API, provider, and webhook traffic.
- Server-only API keys and OAuth/client secrets.
- Application-level encryption for artist-supplied provider tokens where
  implemented.
- Tenant-scoped object keys and API authorization checks.
- Consent gate before StageLink-owned browser analytics.
- No raw bearer tokens, cookies, card data, provider tokens, or message bodies
  in logs.
- Retention candidate reporting before destructive cleanup jobs.

### Contractual Measures

- DPA or equivalent terms for every active processor.
- SCCs, UK IDTA/addendum, Swiss terms, DPF certification, or adequacy evidence
  where applicable.
- Subprocessor list and update-notice process.
- Incident notice channel and provider security contact.
- DSAR/deletion assistance channel or documented provider limitation.

### Organizational Measures

- Provider evidence owner and review cadence.
- New-provider privacy review before production use.
- Separate review for new OAuth scopes, Admin APIs, order/customer scopes,
  marketing pixels, session replay, AI/model-training uses, or support tools.
- Quarterly re-review during active launch iteration.
- Launch approval checklist that captures regions, retention, and transfer
  mechanisms before public scale.

## Transfer Impact Assessment Questions

For each active provider, record answers in `provider-compliance-matrix.md` or
an internal evidence register:

- What exact legal entity provides the service?
- What personal data categories can the provider receive?
- Is the provider a processor, subprocessor, independent controller, or mixed?
- What country or region stores primary data?
- Can support, security, or subprocessors access data from other countries?
- Which transfer mechanism applies to EEA/UK/Swiss data?
- If relying on DPF, is the exact entity certified and scoped to the relevant
  data?
- If relying on SCCs, which module applies and has the importer accepted it?
- What encryption, access control, logging, and deletion controls reduce access
  risk?
- What is the provider retention period for data, logs, backups, artifacts, and
  support tickets?
- How does StageLink request deletion, export, restriction, or incident support?
- What user-facing disclosure is required in Privacy Policy, Cookie Policy, or
  artist terms?

## Public Policy Language Requirements

The final public Privacy Policy should disclose, in plain language:

- StageLink uses providers in other countries to host, secure, operate,
  analyze, bill, and support the product.
- Personal data may be processed outside the user's country, including in the
  United States and other countries where providers or subprocessors operate.
- StageLink uses safeguards such as DPAs, SCCs, adequacy decisions, DPF
  certification where applicable, encryption, access controls, and provider
  reviews.
- Payment data is handled by Stripe and may be retained by Stripe under its own
  legal obligations.
- Public embeds and outbound links can expose visitor metadata directly to
  external providers.
- Artists may configure integrations that involve third-party providers, and
  those providers may have their own privacy terms.

Avoid:

- naming providers that are not active;
- promising all data stays in one jurisdiction;
- promising StageLink can delete independent-provider records it does not
  control;
- using consent as the primary transfer safeguard for routine cloud providers.

## Launch Readiness

StageLink is not international-transfer complete until:

1. Active provider evidence register is complete.
2. Production regions are confirmed for Railway/API/DB, Vercel logs/runtime,
   object storage/CDN, PostHog, email, and Redis if used.
3. DPAs/SCCs/transfer terms are recorded for active processors.
4. Exact DPF reliance, if any, is verified against certified provider entities.
5. EmailJS and SoundCloud launch decisions are made.
6. Provider-side DSAR/deletion paths are documented for WorkOS, Stripe,
   PostHog, storage, email, hosting logs, and integration providers.
7. Public policy language is reviewed by counsel.

## Sources Used

- GDPR Chapter V, Transfers of personal data to third countries or
  international organisations:
  https://eur-lex.europa.eu/eli/reg/2016/679/oj
- European Commission, Standard Contractual Clauses for international
  transfers:
  https://commission.europa.eu/publications/standard-contractual-clauses-international-transfers_en
- Commission Implementing Decision (EU) 2021/914 on Standard Contractual
  Clauses:
  https://op.europa.eu/en/publication-detail/-/publication/55862dbf-c72b-11eb-a925-01aa75ed71a1
- EDPB Recommendations 01/2020 on supplementary measures for international
  transfers:
  https://www.edpb.europa.eu/our-work-tools/our-documents/recommendations/recommendations-012020-measures-supplement-transfer_en
- EDPB SME guide, international data transfers:
  https://www.edpb.europa.eu/sme-data-protection-guide/international-data-transfers_en
- European Commission adequacy decision for the EU-US Data Privacy Framework:
  https://eur-lex.europa.eu/eli/dec_impl/2023/1795/oj
- Data Privacy Framework official program site:
  https://www.dataprivacyframework.gov/
