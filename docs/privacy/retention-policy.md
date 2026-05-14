# StageLink Data Retention Policy

Status: proposed operational baseline for Privacy Plan.
Date: 2026-05-14

This policy is a product/privacy engineering baseline, not final legal advice.
Retention periods must be reviewed by counsel before public launch and updated
when the operating entity, tax jurisdiction, and provider contracts are final.

## Retention Table

| Data category | Default retention | Deletion/anonymization strategy | Rationale | Status |
| --- | --- | --- | --- | --- |
| Account identity | Active account lifetime | On erasure, anonymize local user row and suspend account | Account access, tenant ownership, audit references | Implemented locally |
| WorkOS identity/session records | Provider-managed | Manual provider deletion/revocation workflow | Auth/security records | Gap |
| Artist profile/workspace | Active workspace lifetime | Delete sole-owner workspace; remove membership from shared workspaces | Contractual service delivery | Implemented locally |
| Public page blocks | Active page/workspace lifetime | Cascade delete with workspace/page | Public page service | Implemented locally |
| EPK data | Active workspace lifetime | Cascade delete with artist workspace | EPK service delivery | Implemented locally |
| Uploaded assets DB rows | Active workspace/asset lifetime | Cascade local rows with artist deletion | Media hosting service | Local DB implemented |
| Uploaded asset objects | Active workspace/asset lifetime | Delete object on asset/workspace deletion | Storage minimization | Needs verification/automation |
| Subscriber/fan data | Until unsubscribe, artist deletion, or future retention limit | Delete with sole-owner artist workspace; future unsubscribe/delete flow needed | Fan subscription and consent evidence | Partial |
| Subscriber consent evidence | Subscriber lifetime plus legal-defense period if needed | Delete/anonymize with subscriber record or legal retention rule | Consent accountability | Partial |
| Raw analytics events | Proposed 13 months | Scheduled purge/anonymization | Useful metrics while limiting behavioral history | Gap |
| Aggregated analytics | Proposed 24 months | Keep aggregate, delete raw identifiers | Historical dashboard value | Gap |
| QA/internal analytics | Proposed 90 days | Scheduled purge by quality flags | Test data minimization | Gap |
| PostHog analytics | Provider retention; recommended 12-13 months | Configure retention/deletion in PostHog | Consent-based product analytics | Gap |
| Billing/subscription metadata | Account/workspace lifetime plus legal/accounting period | Retain minimal IDs/status; delete workspace-linked local records where permitted | Billing, access, disputes | Needs legal confirmation |
| Stripe records | Stripe/legal retention | Provider-managed; deletion subject to law | Payment/tax/fraud obligations | Provider-managed |
| Stripe webhook idempotency records | Proposed 13 months minimum | Purge old processed IDs after replay window/legal review | Replay protection and auditability | Gap |
| OAuth/platform tokens | Active connection lifetime | Delete on disconnect/account deletion; revoke provider token where possible | Connected insights features | Partial/local |
| Platform insights snapshots | Proposed 13 months raw snapshots | Scheduled purge or aggregate | Metrics value with storage limitation | Gap |
| Shopify/merch tokens | Active connection lifetime | Delete on disconnect/account deletion | Store/merch integration | Partial/local |
| DSAR request records | Proposed 3 years | Retain limited metadata, no sensitive export payload | Compliance evidence/legal defense | Implemented storage, policy pending |
| Audit logs | Proposed 12-36 months depending severity | Retain minimal metadata; purge old logs | Security/legal defense | Gap |
| Runtime logs | Provider default, target 30-90 days | Provider retention controls | Operations/security | Gap |
| Contact/support emails | Proposed 12 months for leads/support, shorter for spam | Delete from inbox/provider when no longer needed | Support and inbound requests | Gap |
| Consent cookies | 180 days | Expire and re-prompt | Consent freshness | Implemented client-side |

## Deletion Strategy

Current local erasure strategy:

1. Verify authenticated session and email confirmation.
2. Create DSAR request record.
3. For each artist membership:
   - delete artist workspace if the user is sole owner;
   - otherwise remove the user's membership.
4. Delete subscribers before sole-owner artist deletion.
5. Anonymize local user row.
6. Record audit and DSAR completion metadata.

Retained local records:

- privacy-safe audit logs;
- DSAR request metadata;
- anonymized user anchor where needed for referential integrity.

External provider tasks:

- WorkOS account/session deletion or revocation;
- Stripe customer/payment record handling where legally possible;
- PostHog person/event deletion where applicable;
- Vercel/Railway/GitHub log/artifact review;
- object-storage cleanup.

## Anonymization Rules

Recommended:

- Replace local email with non-routable deleted-account placeholder.
- Remove first/last name and avatar URL.
- Remove or redact tokens before exports/logs.
- Preserve only aggregate analytics when raw event identifiers are no longer
  needed.
- Avoid storing original filenames after they are no longer needed for user
  display/debugging.

## Retention Jobs Needed

Before public launch or the first meaningful user cohort:

- raw analytics purge/anonymization job;
- audit log aging job;
- old Stripe webhook event purge policy;
- failed/pending upload cleanup job;
- orphaned object-storage cleanup job;
- DSAR provider-side deletion checklist or queue;
- PostHog retention/deletion configuration;
- contact inbox retention workflow.

## Backup Retention

Railway backups are currently disabled on the Hobby plan. When Railway Pro is
enabled:

- define backup retention duration;
- restrict backup access;
- document how restored backups handle accounts deleted after the backup point;
- run a backup/restore drill with disposable restore DB;
- update DSAR/deletion policy to mention backup lag.
