# Final QA Task 6 - Backup/Restore Drill Readiness

Status: implemented as controlled restore-drill readiness
Last checked: 2026-05-06

## Scope

Close the final-check item for the first Section 8 backup/restore drill without
running a destructive restore against staging or production.

This task verifies that StageLink has repeatable backup/restore commands,
secrets are redacted in dry-run output, unsafe restore targets are blocked, and
the first real drill has a clear approved-disposable-DB protocol.

## Decision

The first real backup/restore drill remains gated until there is:

- an approved staging/source database URL;
- a disposable restore database URL;
- confirmation that the restore database can be dropped/recreated;
- an owner watching Railway/Postgres metrics;
- a place outside git to archive dump checksum, restore logs, data validation
  JSON and row-count evidence.

No live backup or restore was executed during this task.

## Guardrail Evidence

Commands run on 2026-05-06:

```bash
DATABASE_URL=postgresql://stage_user:stage_secret@staging.example.com:5432/stagelink \
pnpm data:backup:dry-run
```

Result: printed the expected `pg_dump` command and redacted the database
password.

```bash
TARGET_DATABASE_URL=postgresql://localhost:5432/stagelink_restore \
pnpm data:restore:dry-run -- --backup backups/example.dump
```

Result: printed the expected `pg_restore` command and the post-restore data
integrity validation step.

```bash
TARGET_DATABASE_URL=postgresql://prod_user:prod_secret@prod.example.com:5432/stagelink \
pnpm data:restore:dry-run -- --backup backups/example.dump
```

Result: blocked as expected because non-local restore targets require explicit
approval.

```bash
DATA_ALLOW_NONLOCAL_RESTORE=true \
TARGET_DATABASE_URL=postgresql://restore_user:restore_secret@restore.example.com:5432/stagelink_restore \
pnpm data:restore:dry-run -- --backup backups/example.dump
```

Result: allowed dry-run output, redacted the database password, and did not
execute restore traffic.

Additional validation:

```bash
bash -n scripts/data/backup-recovery.sh
node --check scripts/data/run-data-integrity.mjs
pnpm typecheck
```

Result: all passed.

## Approved Restore Drill Protocol

Before executing the first real drill:

1. Confirm the source is staging or an approved backup file, not production.
2. Confirm `TARGET_DATABASE_URL` points to a disposable restore database.
3. Confirm the restore target is not used by users, CI, analytics or demos.
4. Open provider monitoring for database CPU, memory, disk and connections.
5. Create ignored output directories:

```bash
mkdir -p backups data-integrity-results
```

6. Create the backup:

```bash
DATABASE_URL=<approved-source-db-url> \
pnpm data:backup -- --execute --output-dir backups
```

7. Restore into the disposable DB and run integrity validation:

```bash
TARGET_DATABASE_URL=<disposable-restore-db-url> \
DATA_INTEGRITY_OUTPUT=data-integrity-results/restore-YYYYMMDD.json \
pnpm data:restore:check -- --execute --backup backups/<dump-file>.dump
```

8. Capture row counts for critical tables before and after restore:

- `users`
- `artists`
- `pages`
- `blocks`
- `subscribers`
- `analytics_events`
- `assets`
- `subscriptions`

9. Archive outside git:

- dump filename;
- dump checksum;
- source DB label;
- restore DB label;
- restore timestamp;
- integrity JSON;
- row-count comparison;
- monitoring screenshots.

## Stop Conditions

Stop and discard the drill if any of these happen:

- target DB is not disposable;
- command points at production;
- restore starts against an unexpected host;
- `pg_restore` reports schema ownership or permission issues that could affect
  shared infrastructure;
- data validation reports critical findings.

## Closure Criteria

Task 6 is closed for final-check readiness when:

- backup dry-run output redacts secrets;
- local restore dry-run prints the restore plus integrity-validation steps;
- non-local restore targets are blocked without explicit approval;
- approved non-local dry-run still redacts secrets and does not mutate data;
- the real drill protocol is documented with required user/provider inputs.
