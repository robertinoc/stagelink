# Final QA Task 9: Row-Count Snapshot

Status: implemented as read-only data reliability tooling

## Context

Section 8 restore drills need a quick way to compare critical table counts
before and after a restore. Until this task, the process was documented but
required manual SQL.

## Implementation

Task 9 adds a read-only row-count snapshot command:

```bash
DATABASE_URL=postgresql://localhost:5432/stagelink_test pnpm data:row-counts
```

The command runs `SELECT COUNT(*)` against StageLink core tables and prints a
table plus a JSON-compatible summary. It does not write to the database.

Optional JSON artifact:

```bash
DATABASE_URL=postgresql://localhost:5432/stagelink_test \
DATA_ROW_COUNTS_OUTPUT=data-integrity-results/row-counts-before.json \
pnpm data:row-counts
```

Production-like database URLs are blocked unless explicitly approved:

```bash
DATA_ALLOW_PRODUCTION=true DATABASE_URL=postgresql://... pnpm data:row-counts
```

## Tables

The snapshot covers:

- `users`
- `artists`
- `artist_memberships`
- `pages`
- `blocks`
- `subscribers`
- `analytics_events`
- `assets`
- `subscriptions`
- `custom_domains`
- `smart_links`
- `epks`
- `stripe_webhook_events`
- `shopify_connections`
- `merch_provider_connections`
- `artist_platform_insights_connections`
- `artist_platform_insights_snapshots`

## Restore Drill Usage

1. Capture a source snapshot before backup:
   `DATA_ROW_COUNTS_OUTPUT=data-integrity-results/source-row-counts.json pnpm data:row-counts`.
2. Create the backup with `pnpm data:backup -- --execute`.
3. Restore into a disposable target with `pnpm data:restore:check -- --execute`.
4. Capture a target snapshot:
   `DATABASE_URL=<target-db> DATA_ROW_COUNTS_OUTPUT=data-integrity-results/target-row-counts.json pnpm data:row-counts`.
5. Compare source and target JSON outside git.

## Result

The row-count comparison follow-up is closed for the current phase. A future
enhancement can add an automated JSON diff if restore drills become frequent.
