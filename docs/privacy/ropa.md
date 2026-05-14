# Record of Processing Activities

Status: Privacy Plan - GDPR Article 30-ready ROPA baseline.
Date: 2026-05-14

This is StageLink's internal Record of Processing Activities (ROPA) baseline.
It is structured to satisfy the operational substance of GDPR Article 30 for a
small SaaS team: purposes, categories, users, lawful bases, processors,
transfers, retention, and security measures.

This record must be reviewed quarterly and whenever StageLink adds a processing
purpose, provider, transfer, analytics/profiling feature, retention change, or
major data category.

## Controller and Contact Fields

These fields must be completed before public launch:

| Field                   | Current status                                                       |
| ----------------------- | -------------------------------------------------------------------- |
| Controller legal entity | Pending final legal/entity confirmation.                             |
| Controller address      | Pending final business address.                                      |
| Privacy contact         | Pending final privacy/support email.                                 |
| EU/UK representative    | To be assessed if GDPR/UK GDPR representative requirements apply.    |
| Data Protection Officer | Not currently assumed; reassess if legal triggers or scale require.  |
| ROPA owner              | Privacy Owner.                                                       |
| ROPA review cadence     | Quarterly and change-triggered.                                      |
| Source docs             | `data-inventory.md`, `data-flow-mapping.md`, provider/retention docs |

## Common Security Measures

Unless a row states otherwise, StageLink processing relies on these baseline
measures:

- WorkOS AuthKit authentication;
- HTTPS/TLS in transit;
- managed PostgreSQL access controls;
- application-level tenant authorization;
- server-side secrets in environment variables;
- token encryption for supported provider credentials;
- privacy-safe logging rules;
- audit logs for sensitive actions where implemented;
- least-privilege provider scopes;
- consent gating for non-essential browser/public analytics;
- CI/build checks and code review;
- incident response and breach escalation docs;
- DSAR export redaction for secrets/tokens.

## ROPA Matrix

| ID      | Processing activity                                    | Purpose                                                                                     | Data categories                                                                                                                                 | Data subject categories                                                    | Lawful basis                                                                                                                         | Processors/providers                                                                        | Transfers                                                                                     | Retention                                                                                                                      | Security measures                                                                                                         | Risk        |
| ------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------- | ----------- |
| ROPA-01 | Authentication and account identity                    | Create accounts, authenticate sessions, enforce suspension/deletion, secure access          | email, name, avatar URL, WorkOS ID, auth/session/security metadata, account timestamps                                                          | account users, team members, admins                                        | Contract for account access; legitimate interests for security; legal obligation where records must be retained                      | WorkOS, Vercel, Railway/API/DB logs                                                         | WorkOS and infrastructure transfers depend on provider region/subprocessors; evidence pending | active account lifetime; local deletion anonymizes user row; provider deletion runbook pending                                 | WorkOS-hosted auth, token/session validation, access control, audit/security logs, no password storage in StageLink DB    | High        |
| ROPA-02 | Onboarding and artist workspace setup                  | Create artist workspace, username, profile, plan context, membership                        | artist name, username, bio, contact details, images/URLs, role/membership, locale, onboarding state                                             | artists, managers/team members                                             | Contract; user direction/consent for public publication; legitimate interests for workspace integrity                                | Railway PostgreSQL, Vercel, object storage/CDN if assets used                               | infrastructure/object storage transfer evidence pending                                       | active workspace lifetime; deletion depends on ownership/shared workspace rules                                                | authenticated dashboard, tenant membership checks, validation, audit logs for sensitive actions                           | High        |
| ROPA-03 | Public artist profiles and pages                       | Publish artist landing pages, links, embeds, fan capture blocks, public content             | public profile fields, page/block content, localized content, URLs, images, contact fields, embeds                                              | artists/team members; public visitors where forms are used                 | Contract; user direction/consent for publication; legitimate interests for abuse/security                                            | Vercel, Railway API/DB, object storage/CDN, external embed providers where used             | CDN/embed/provider transfers may occur; final provider evidence pending                       | active publication/workspace lifetime; browser/search/social caches may persist externally                                     | publish controls, tenant checks, privacy-safe logs, deletion strategy docs                                                | Medium/High |
| ROPA-04 | EPK system                                             | Create electronic press kits for booking/press/business use                                 | bio, press quote, booking/management/press contacts, rider/technical info, availability/location notes, media URLs, translations, publish state | artists, team members, public/recipient viewers                            | Contract; user direction/consent for publication/sharing                                                                             | Railway PostgreSQL, Vercel, object storage/CDN                                              | infrastructure/CDN transfers pending evidence                                                 | active workspace/EPK lifetime; external recipients/caches may persist                                                          | authenticated editor, publish controls, tenant authorization, asset controls                                              | High        |
| ROPA-05 | Fan/subscriber capture                                 | Collect fan emails for artist-managed subscriber lists and capture metrics                  | email, consent flag/text, artist/page/block attribution, source path, hashed IP, timestamps                                                     | public visitors/fans/subscribers                                           | consent where capture form requires it; artist/customer instructions; legitimate interests for abuse prevention and consent evidence | Railway PostgreSQL, email provider if notifications/export later, Vercel/Railway logs       | infrastructure/email transfers pending provider evidence                                      | subscriber retention/deletion policy pending; DSAR/unsubscribe workflow needed                                                 | form consent snapshot, private artist dashboard access, no public exposure, audit/logging limits                          | High        |
| ROPA-06 | Public analytics and artist dashboards                 | Provide page views, link clicks, smart-link metrics, fan capture rates, quality filtering   | artist/page/block IDs, event type, stable IP hash, link IDs/labels, smart-link IDs, consent/QA/bot flags, timestamps                            | public visitors in aggregate/pseudonymous form; artists as dashboard users | consent for non-essential public analytics; legitimate interests for security/quality flags                                          | Railway PostgreSQL, PostHog when consented/configured                                       | PostHog and infrastructure transfer evidence pending                                          | raw analytics retention/anonymization not enforced yet; policy pending                                                         | consent gating, no raw IP storage, PostHog `ip:false`, autocapture off, quality filters                                   | Medium/High |
| ROPA-07 | Authenticated product analytics                        | Understand onboarding, profile editing, block lifecycle, product usage                      | actor user ID, artist ID, event names, field names, page/block IDs, timestamps                                                                  | account users/artists/team members                                         | lawful basis pending final decision: consent/preference or legitimate interests with objection path                                  | PostHog server-side if configured, Railway/Vercel logs                                      | PostHog transfer evidence pending                                                             | PostHog retention not confirmed                                                                                                | minimal payloads, `$process_person_profiles:false`, no email/token/payment content intended                               | High        |
| ROPA-08 | StageLink Insights integrations                        | Connect and display cross-platform artist metrics from Spotify, YouTube, SoundCloud         | provider account IDs/handles/URLs, display names, public metrics, top content snapshots, tokens where applicable                                | artists/account users; public artist accounts referenced                   | Contract/user direction; legitimate interests for secure integration operation                                                       | Spotify, YouTube/Google, SoundCloud, Railway DB, Vercel/Railway, token encryption           | provider API and infrastructure transfers; provider policies apply                            | snapshot retention/disconnect/delete behavior pending final implementation                                                     | OAuth/scope review, token encryption where implemented, tenant checks, provider disconnect rules                          | High        |
| ROPA-09 | Payments and subscriptions                             | Sell FREE/PRO/PRO+ plans, checkout, billing portal, subscription state, webhook idempotency | Stripe customer/subscription IDs, plan/price, billing state, webhook event IDs, email metadata in Stripe, timestamps                            | account users, artist workspace owners/billing admins                      | Contract; legal obligation for tax/accounting/payment records; legitimate interests for fraud/webhook integrity                      | Stripe, Railway PostgreSQL, Vercel/Railway logs                                             | Stripe transfers/subprocessors; DPA/SCC/DPF evidence required                                 | Stripe/legal retention applies; local subscription state retained while account/workspace active plus dispute/accounting needs | Stripe-hosted payment collection, no raw card storage in StageLink, webhook signature validation/idempotency              | High        |
| ROPA-10 | Cookies and consent management                         | Store consent choices, localization, necessary auth/session state, analytics opt-in/out     | `sl_consent`, `sl_ac`, locale cookies, WorkOS/AuthKit cookies, PostHog identifiers after consent                                                | public visitors, account users                                             | consent for non-essential analytics; contract/legitimate interests for necessary cookies                                             | WorkOS, PostHog when consented, Vercel                                                      | provider/browser storage transfers as applicable                                              | consent cookie duration per consent docs; provider storage cleanup best effort on withdrawal                                   | consent banner/settings, analytics blocking before consent, withdrawal cleanup, respect DNT                               | Medium/High |
| ROPA-11 | DSAR and privacy request handling                      | Process access, rectification, deletion, portability, request lifecycle, accountability     | request type/status, identity/account ID, export payload metadata, deletion/rectification logs, audit entries                                   | account users and affected data subjects                                   | legal obligation; legitimate interests for verification and accountability                                                           | Railway PostgreSQL, WorkOS/Stripe/PostHog/providers when deletion/export requires follow-up | provider transfers depend on request scope                                                    | DSAR records proposed 3 years after completion; final legal review pending                                                     | authenticated request flow, identity verification posture, export redaction, audit logs                                   | High        |
| ROPA-12 | Support/admin operations                               | Respond to support/contact requests, diagnose account issues, perform admin actions         | names, emails, support messages, account/workspace IDs, admin action logs, request metadata                                                     | prospects, users, artists, team members, fans who contact support          | legitimate interests; contract support; consent where user submits contact form                                                      | Resend/EmailJS if enabled, email inbox, Railway/Vercel logs, admin tools                    | email/provider/infrastructure transfers pending evidence                                      | support inbox retention pending; audit logs proposed retention in logging policy                                               | admin RBAC, audit logs, no sensitive body logging, need-to-know access                                                    | High        |
| ROPA-13 | Security, audit, fraud, and incident response          | Detect abuse, investigate incidents, preserve evidence, secure platform                     | audit log metadata, security events, request IDs, IP where needed, WorkOS/Radar events, Stripe webhook status, incident records                 | users, admins, visitors, attackers/abusive actors                          | legitimate interests; legal obligation for breach/accountability records                                                             | WorkOS, Stripe, Railway, Vercel, PostHog logs if relevant, storage/email providers          | provider transfer evidence pending                                                            | audit/incident retention pending final policy; incident registry retained for accountability                                   | privacy-safe logs, incident playbooks, breach classification, evidence handling, access controls                          | High        |
| ROPA-14 | Infrastructure hosting, build, deployment, and backups | Run web/API/database, deploy releases, recover service, store logs/artifacts/backups        | application data in DB, runtime logs, build metadata, environment secrets, backup snapshots                                                     | all relevant StageLink data subjects depending on records processed        | contract/service delivery; legitimate interests for reliability/security; legal obligation where records preserved                   | Vercel, Railway, GitHub, object storage/CDN, backup provider if separate                    | infrastructure/provider transfers; region/subprocessor evidence pending                       | log/backup retention pending final provider settings and backup policy                                                         | managed platform controls, environment secrets, restricted repo/provider access, deployment logs, incident recovery rules | High        |

## ROPA Maintenance Rules

Update this ROPA before release when a change:

- introduces a new provider, processor, subprocessor category, or transfer;
- collects a new category of personal data;
- changes legal basis, consent, opt-out, or public disclosures;
- changes retention/deletion/anonymization behavior;
- adds analytics, profiling, AI, ranking, recommendations, segmentation, or
  marketing pixels;
- changes authentication, role/access control, billing, DSAR, admin tooling, or
  tenant isolation;
- expands support/admin access to user data.

## Known Gaps

- Controller legal entity, privacy contact, and representative assessment are
  not finalized.
- Provider evidence remains incomplete for DPAs, SCCs/DPF, regions,
  subprocessors, retention, and deletion behavior.
- Raw analytics and backup retention need implementation evidence.
- Authenticated product analytics needs final lawful-basis and opt-out/objection
  posture.
- StageLink Insights needs retention/disconnect/delete evidence and final public
  disclosure wording.
- DSAR provider-side deletion completion remains manual.

## Source and Article 30 Notes

Article 30 requires records of processing activities including purposes,
categories of data subjects and personal data, recipients, transfers, erasure
time limits where possible, and security measures where possible.

Official source: https://eur-lex.europa.eu/eli/reg/2016/679/oj
