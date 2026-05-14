# Retention Cleanup Jobs

Status: Data Retention and Lifecycle baseline.
Date: 2026-05-14

## Current Implementation

This phase adds a read-only candidate report:

```bash
pnpm data:retention:candidates
```

The report uses:

- `scripts/data/run-retention-candidates.mjs`
- `scripts/data/retention-candidates.sql`

It counts rows that would be candidates for future retention jobs. It does not
delete or mutate data.

## Candidate Categories

Current dry-run checks:

- raw analytics older than 13 months;
- QA/internal/non-production/bot analytics older than 90 days;
- stale pending uploads older than 24 hours;
- failed/deleted upload rows older than 30 days;
- Stripe webhook idempotency rows older than 13 months;
- platform insights snapshots older than 13 months;
- audit logs older than 12 months;
- completed DSAR records older than 3 years;
- soft-deleted/anonymized local users older than 30 days.

## Production Safeguard

The runner refuses production-like database URLs unless one of these is set:

- `--allow-production`
- `DATA_ALLOW_PRODUCTION=true`

This mirrors the existing data validation tools.

## Future Cleanup Job Architecture

Recommended phases:

1. Dry-run only in local/staging.
2. Dry-run in production with owner approval.
3. Manual review of candidate counts and sample IDs.
4. Small-batch deletion in staging.
5. Staging restore/drill validation.
6. Production rollout with rate limits and alerting.

## Safe Job Design

Every destructive job must:

- support dry-run mode;
- require explicit production opt-in;
- process small batches;
- use transactions for DB-only deletes;
- record summary audit events;
- skip records on legal hold, paid-plan conflict, unresolved DSAR, or recent
  activity;
- be idempotent;
- report partial failures;
- avoid deleting Stripe/legal records incorrectly;
- verify object storage deletion separately from DB row deletion.

## Proposed Jobs

| Job | Frequency | Action |
| --- | --- | --- |
| `analytics-retention` | daily/weekly | Delete or aggregate old raw analytics and QA/internal events. |
| `asset-stale-upload-cleanup` | hourly/daily | Delete stale pending/failed asset rows and verify object storage. |
| `webhook-idempotency-retention` | monthly | Delete Stripe webhook event IDs older than final window. |
| `insights-snapshot-retention` | weekly/monthly | Delete old platform insight snapshots after aggregation/window. |
| `audit-log-retention` | monthly | Purge old audit rows outside security/legal retention. |
| `dsar-record-retention` | monthly/quarterly | Purge expired completed DSAR metadata. |
| `inactive-account-candidates` | monthly | Report inactive free accounts; no automatic deletion initially. |

## Failure Handling

Required behavior:

- fail closed on missing config;
- stop batch on transaction errors;
- retry idempotent external deletes;
- record failed object/provider cleanup for manual review;
- never continue blindly after a partial provider failure.

## Why No Destructive Job Is Enabled Yet

The prompt asks for production-ready lifecycle management, but enabling real
deletion without final legal periods, provider runbooks, backup policy, and
staging proof would be unsafe.

Current decision:

- implement retention architecture and candidate reporting now;
- keep destructive cleanup disabled until legal/product/ops approval.

