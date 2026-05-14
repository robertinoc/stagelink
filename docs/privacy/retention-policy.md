# StageLink Data Retention Policy

Status: Privacy Plan retention/lifecycle baseline.
Date: 2026-05-14
Scope: StageLink web/API/database/provider/browser persistence observed in the
current repository and privacy documentation.

This policy applies GDPR storage-limitation principles to StageLink's real data
model. It is a product/privacy engineering baseline, not final legal advice.
Final periods must be reviewed once the operating entity, tax jurisdiction, and
provider contracts are final.

## Retention Principles

- Keep personal data only while it has a product, security, legal, or user
  benefit.
- Prefer deletion over indefinite retention.
- Prefer aggregation/anonymization over raw behavioral history.
- Keep legally required billing/accounting records, but minimize local copies.
- Do not silently delete active user content without notice and recovery
  safeguards.
- Treat backups, logs, analytics providers, and email inboxes as persistence
  layers, not implementation details.

## Operational Retention Matrix

| Data category | Main system | Proposed retention | Trigger | Deletion/anonymization rule | Legal/business rationale | Status |
| --- | --- | --- | --- | --- | --- | --- |
| Account identity | WorkOS + `users` | Active account lifetime; local anonymized anchor after erasure | User erasure, verified admin action | Anonymize local user, suspend account, provider deletion runbook | Contract, security, legal defense | Local implemented; provider manual |
| WorkOS sessions/security events | WorkOS | Provider-managed; align to WorkOS plan/policy | Account erasure/provider review | Revoke sessions and request deletion where supported | Authentication/security | Manual gap |
| Artist profile/workspace | PostgreSQL `artists`, memberships | Active workspace lifetime | Workspace deletion, sole-owner account erasure | Delete sole-owner workspace; remove deleting user from shared workspace | Contract/service delivery | Implemented locally |
| Public page blocks | `pages`, `blocks` | Active page/workspace lifetime | Workspace/page deletion | Cascade with workspace/page; disclose external cache risk | Public page service | Implemented locally |
| EPK data | `epks`, assets | Active workspace lifetime | Workspace deletion, EPK deletion/unpublish | Cascade with workspace; unpublish hides public view | EPK service delivery | Implemented locally |
| Uploaded asset rows | `assets` | Active asset/workspace lifetime; stale pending max 24h; failed max 30d | Asset deletion, workspace deletion, cleanup job | Mark/delete row after object deletion verification | Media hosting/minimization | Local rows implemented; cleanup needed |
| Uploaded object files | S3-compatible storage | Active asset/workspace lifetime; stale pending max 24h | Asset/workspace deletion, stale pending cleanup | Delete object first or verify missing object before deleting row | Storage minimization | Needs verified job |
| Subscriber/fan data | `subscribers` | Until unsubscribe/delete, artist deletion, or final fan-list retention policy | Unsubscribe, fan DSAR, artist deletion | Delete or anonymize email while retaining minimal consent proof if needed | Consent and artist fan-list service | Partial |
| Subscriber consent evidence | `subscribers.consent*` | Subscriber lifetime + legal defense window if separated later | Subscriber deletion/legal retention expiry | Retain only hashed email/consent timestamp if legal basis requires | Consent accountability | Needs final model |
| Raw first-party analytics | `analytics_events` | 13 months | Scheduled retention job | Delete raw rows or aggregate then delete identifiers | Dashboard value with storage limitation | Candidate script added; delete job not enabled |
| QA/internal analytics | `analytics_events` quality flags | 90 days | Scheduled retention job | Delete rows where `is_qa`, `is_internal`, or non-production | Test data minimization | Candidate script added |
| Bot-suspected analytics | `analytics_events` | 90 days unless needed for abuse review | Scheduled retention job | Delete or aggregate abuse counts | Abuse monitoring/minimization | Candidate script added |
| Aggregated analytics | Future aggregate table/provider dashboards | 24 months | Aggregation lifecycle | Keep aggregate counts, no raw IP hash/user identifiers | Product dashboard continuity | Future |
| PostHog browser analytics | PostHog | 12-13 months recommended | Provider configuration | Configure retention and deletion; respect consent | Consent-based product analytics | Provider config gap |
| Billing/subscription metadata | `subscriptions`, Stripe | Local active workspace + legal/accounting review; Stripe legal retention | Workspace erasure, accounting expiry | Retain minimal IDs/status where needed; Stripe remains system of record | Billing, tax, disputes, fraud | Needs legal confirmation |
| Stripe webhook idempotency records | `stripe_webhook_events` | 13 months minimum | Scheduled retention job | Delete old processed event IDs after replay/dispute window | Replay protection and auditability | Candidate script added |
| OAuth/platform tokens | insights connections/providers | Active connection lifetime | Disconnect/account deletion/token expiry | Delete local token, revoke provider token where possible | Integration functionality | Local partial; provider manual |
| Platform insights snapshots | `artist_platform_insights_snapshots` | 13 months raw snapshots | Scheduled retention job | Delete old raw snapshots; keep aggregate trends later | Metrics value with minimization | Candidate script added |
| Shopify/merch tokens | integration tables | Active connection lifetime | Disconnect/workspace deletion | Delete encrypted token and provider references | Store/merch integration | Local partial |
| Smart links | `smart_links` | Active workspace lifetime | Workspace/smart-link deletion | Delete with workspace; analytics handled separately | Link routing service | Implemented locally |
| DSAR request records | `dsar_requests` | 3 years after completion | Scheduled retention job | Keep limited metadata only; no export payloads | Compliance accountability/legal defense | Candidate script added |
| Audit logs | `audit_logs` | 12 months standard; 36 months for security/legal holds if introduced | Scheduled retention job | Purge old privacy-safe metadata after retention period | Security/accountability | Candidate script added |
| Runtime logs | Vercel/Railway/provider logs | 30-90 days target | Provider retention controls | Provider purge/retention setting | Operations/security | Provider config gap |
| Contact/support emails | Resend/email inbox | 12 months for leads/support; shorter for spam | Inbox/support workflow | Delete from inbox/provider when no longer needed | Support and inbound requests | Operational gap |
| Consent cookies | Browser | 180 days | Cookie expiry/version change | Expire and re-prompt | Consent freshness | Implemented client-side |
| Browser local/session storage | Browser | Session or until explicit cleanup | Logout/withdrawal/browser cleanup | Avoid sensitive values; remove analytics identifiers on withdrawal | App function/consent | Implemented for PostHog cleanup |
| Backups | Railway future Pro backups | Not active on Hobby; define before Pro/public scale | Backup policy | Restore-aware deletion disclosure; limited access | Disaster recovery | Deferred by plan decision |

## Current Persistence Audit

Observed persistence layers:

- PostgreSQL tables in `apps/api/prisma/schema.prisma`.
- Object storage for uploaded assets.
- WorkOS AuthKit identity/session/security records.
- Stripe customer/subscription/payment systems and local subscription metadata.
- PostHog browser/server analytics where enabled and consented.
- Vercel and Railway runtime/build logs.
- Resend/email inbox for contact/support flows.
- Upstash Redis for Behind roles and role audit.
- Browser cookies for auth/session and consent.
- Browser local/session storage for analytics identifiers after consent.
- GitHub Actions artifacts/logs for CI evidence.

Main indefinite-retention risks:

- `analytics_events` raw rows.
- `artist_platform_insights_snapshots`.
- `audit_logs`.
- `stripe_webhook_events`.
- stale pending/failed `assets`.
- provider logs and analytics retention.
- support/contact inbox messages.
- future Railway backups once Pro is enabled.

## Deletion Strategy Summary

Detailed deletion ordering is maintained in `deletion-strategy.md`.

Current local erasure strategy:

1. Verify authenticated session and email confirmation.
2. Create DSAR request record.
3. For each artist membership:
   - delete the artist workspace if the user is sole owner;
   - otherwise remove the user's membership.
4. Delete/anonymize local user data.
5. Record audit and DSAR completion metadata.

External provider tasks remain manual:

- WorkOS account/session deletion or revocation.
- Stripe customer/payment record handling where legally possible.
- PostHog person/event deletion where applicable.
- Vercel/Railway/GitHub log/artifact review.
- Object-storage cleanup verification.
- Connected provider token revocation.

## Cleanup Enforcement

This phase adds a read-only candidate report:

- script: `pnpm data:retention:candidates`
- SQL: `scripts/data/retention-candidates.sql`

The script does not delete data. It counts candidate rows for future cleanup
jobs and refuses production-like database URLs unless explicitly allowed.

Deletion jobs should be enabled only after:

- legal review confirms final periods;
- staging dry-run evidence is reviewed;
- backup/restore implications are understood;
- a rollback/recovery plan exists where legally appropriate.

## Backup Retention

Railway backups are currently disabled because the project is on the Railway
Hobby plan. The launch decision remains:

- keep automatic backups deferred while the product is pre-public/private QA;
- enable Railway Pro backups before public launch or once the first 100 users
  threshold is reached, whichever happens first;
- document backup retention, restore access, and deletion lag before enabling
  broad public access.
