# StageLink Account Deletion Policy

StageLink uses a privacy-safe deletion strategy that removes public visibility
and personal identifiers while preserving limited records required for security,
legal, and operational integrity.

## What Is Deleted

When a user confirms account deletion:

- sole-owner artist workspaces are deleted;
- pages, blocks, EPKs, assets, smart links, analytics rows, custom domains,
  subscriptions, platform connections, and snapshots attached to those artist
  workspaces are deleted via existing ownership cascades;
- subscribers for those artist workspaces are deleted before workspace deletion;
- memberships in shared workspaces are removed.

## What Is Anonymized

The `users` row is retained but anonymized:

- `email` becomes `deleted-{userId}@deleted.stagelink.local`;
- `workos_id` becomes `deleted:{userId}`;
- first name, last name, and avatar URL are cleared;
- `is_suspended` is set to true;
- `deleted_at` is set.

This avoids foreign-key breakage and keeps a minimal internal anchor for audit
and DSAR records without preserving the original identity.

## What May Be Retained

StageLink may retain:

- privacy-safe audit logs;
- DSAR request logs;
- Stripe billing/payment records required by law;
- WorkOS identity/security logs according to WorkOS retention;
- infrastructure logs for limited operational retention.

## Current External Provider Handling

The current implementation does not automatically delete or revoke external
provider records through Stripe, WorkOS, PostHog, Vercel, Railway, or email
providers. This must be handled operationally for escalated erasure requests
until provider-specific deletion automation is implemented.

## Future Improvements

- WorkOS account deletion/revocation after local anonymization.
- Provider deletion queue for Stripe/PostHog/WorkOS records.
- Grace-period deletion workflow for accidental requests.
- Admin DSAR dashboard with status tracking and manual provider tasks.
