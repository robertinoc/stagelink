# Inactive Account Policy

Status: Data Retention and Lifecycle baseline.
Date: 2026-05-14

## Objective

Inactive-account handling should reduce unnecessary long-term retention without
surprising artists or destroying workspaces silently.

## Inactivity Signals

Potential signals:

- last successful WorkOS login;
- last dashboard API request;
- last artist/profile/page/EPK update;
- last billing action;
- last provider sync;
- last public page publish/unpublish.

Current gap:

- StageLink does not currently persist a clear `lastActiveAt` field on local
  users. WorkOS may have provider-side activity, but local lifecycle jobs need
  a local signal before automation.

## Proposed Thresholds

| Account type | Inactive candidate | Notice window | Deletion/anonymization |
| --- | --- | --- | --- |
| FREE, no published workspace | 12 months | 60-90 days | Anonymize/delete if no response and no legal hold. |
| FREE, published workspace | 12 months | 90 days | Unpublish/archive first; do not destroy without clear notice. |
| PRO/PRO+ active or past due | No automatic deletion | Billing lifecycle applies | Preserve during billing/legal period. |
| Suspended | Manual review | Case-dependent | Preserve evidence until resolved. |
| Shared workspace owner/member | Manual review | Case-dependent | Require ownership/member impact review. |

## Notification Strategy

Before destructive action:

1. Send first notice explaining inactivity and options.
2. Send final notice before archival/deletion.
3. Provide a simple recovery action: log in, export data, delete account, or
   contact support.
4. Do not use marketing opt-in for required account lifecycle notices.

## Archival Strategy

If implemented before deletion:

- hide/unpublish stale public content;
- pause provider syncs;
- disable non-essential notifications;
- retain user ability to reactivate during the notice/grace period.

## Deletion Strategy

Only run automatic deletion/anonymization when:

- account is FREE;
- no active paid plan;
- no unresolved billing/security/DSAR issue;
- no shared workspace ownership risk;
- notices were sent and grace period expired;
- provider deletion runbook is ready.

## Current Recommendation

Do not enable automatic inactive account deletion before public launch.

Instead:

- document thresholds now;
- add `lastActiveAt` later;
- ship dry-run candidate reporting first;
- review candidate reports manually in Behind before enabling destructive jobs.

