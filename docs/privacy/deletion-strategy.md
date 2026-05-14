# Deletion Strategy

Status: Data Retention and Lifecycle baseline.
Date: 2026-05-14

## Safety Principles

- Do not delete production data without an authenticated, verified, auditable
  request or a reviewed retention job.
- Delete child/provider/object data in an order that avoids orphaned records.
- Preserve legally required billing, security, and compliance records.
- Prefer dry-run reports before automated cleanup.
- Use idempotent jobs: a retry should not corrupt state.

## Account Erasure Order

Recommended local order:

1. Create or update `dsar_requests` row.
2. Validate identity and destructive-action confirmation.
3. Resolve memberships and ownership.
4. For sole-owner artists:
   - unpublish public page/EPK if needed;
   - collect asset object keys for deletion;
   - delete subscribers, blocks, page, EPK, analytics, smart links,
     integrations, assets, and workspace records through cascade/explicit
     service logic.
5. For shared artists:
   - remove the deleting user's membership;
   - do not delete shared workspace content.
6. Anonymize local user:
   - replace email with non-routable deleted placeholder;
   - null first/last name and avatar;
   - set `workosId` to a deleted marker;
   - set `isSuspended=true` and `deletedAt`.
7. Record audit completion.
8. Queue/manual-run provider deletion tasks.

## Object Storage Deletion

Required target behavior:

1. Collect candidate `assets.objectKey` values.
2. Delete object from storage.
3. Verify object is gone or object was already missing.
4. Mark/delete local asset row.
5. Log result with asset ID, artist ID, status, and request ID.

Do not:

- delete the DB row before the object deletion result is known, unless a repair
  job records the orphan risk.
- expose object keys in public responses.

## Provider Deletion Tasks

Manual runbook required until automation exists:

| Provider | Action |
| --- | --- |
| WorkOS | Revoke sessions; delete/deactivate user where supported and legally appropriate. |
| Stripe | Preserve legally required payment/accounting records; delete optional customer metadata where possible. |
| PostHog | Delete person/profile/events where consent-based product analytics identifies the user. |
| Resend/email inbox | Delete support/contact messages after retention. |
| Vercel/Railway | Review log retention; logs age out per provider settings. |
| Object storage | Delete user/workspace asset objects. |
| Spotify/YouTube/SoundCloud/Shopify/merch | Revoke tokens/delete local connection; request provider-side deletion where applicable. |

## Cleanup Job Deletion Order

When automated jobs are introduced:

1. Build candidate set.
2. Write dry-run counts and sample IDs to an internal report.
3. Apply exclusion guardrails:
   - active legal hold;
   - active paid plan;
   - unresolved DSAR/billing/security incident;
   - recent activity;
   - shared workspace ownership risk.
4. Process in small batches.
5. Wrap DB mutations in transactions.
6. Delete external objects/providers with idempotent retry state.
7. Emit audit summary.
8. Alert on partial failure.

## Rollback and Recovery

Allowed rollback:

- Soft-deleted account within grace period.
- Failed cleanup job before destructive mutation.
- Restored object if object deletion has not occurred.

Not guaranteed:

- Recovery after permanent anonymization.
- Recovery after provider-side deletion.
- Recovery from backups without reintroducing already-deleted personal data.

## Legal Holds

StageLink does not yet implement legal holds.

If introduced, legal holds must:

- block cleanup for specified user/artist/provider records;
- record reason and owner;
- be visible only to authorized admins;
- have an expiration or review date.

## Current Gaps

- Provider deletion/revocation is manual.
- Object storage deletion is not proven end-to-end.
- Automated cleanup jobs are not enabled.
- WorkOS step-up before destructive deletion is not implemented.
- No legal hold system exists.

