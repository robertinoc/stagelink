# StageLink — Data & Reliability Section 8

Status: implemented for repeatable validation plus backup/recovery dry-runs and
row-count snapshots
Last checked: 2026-05-06

This document records the Section 8 reliability work:

- 8.1 Data validation: integrity, consistency and duplicate checks
- 8.2 Backup & recovery: backup command, restore-check flow and no-data-loss
  verification path

## Scope

This section covers database reliability controls that can be tested safely from
the repo:

- schema-backed data consistency
- duplicate detection beyond strict DB unique constraints
- integration-test database reset correctness
- backup command generation
- restore validation against a disposable target database
- read-only row-count snapshots for before/after restore comparison

No destructive restore was run against staging or production in this PR.

## Fixes Applied

| Finding                                                                                                                                            | Impact                                                                                      | Fix                                                                                                                            |
| -------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Integration DB reset did not include newer tables such as EPK, assets, SmartLinks, insights, Stripe webhook events, Shopify and merch connections. | Integration tests could leak data between runs and produce false positives/false negatives. | Expanded `RESET_TABLES` in `apps/api/src/test/integration-db.ts` to cover every mapped Prisma model table.                     |
| No guard existed to keep the reset table list aligned with Prisma schema evolution.                                                                | Future schema additions could silently bypass integration resets.                           | Added `apps/api/src/test/integration-db.spec.ts`, which compares `RESET_TABLES` against mapped Prisma model tables.            |
| No repeatable repo-level data integrity runner existed.                                                                                            | Data validation depended on manual SQL and was not auditable.                               | Added `scripts/data/data-integrity.sql` and `scripts/data/run-data-integrity.mjs`.                                             |
| Backup/restore procedure was not encoded in repo tooling.                                                                                          | Recovery validation could be improvised during an incident.                                 | Added `scripts/data/backup-recovery.sh` with dry-run default, safe restore target guard and post-restore integrity validation. |
| Row-count comparison required manual SQL during restore drills.                                                                                    | No-data-loss checks were slower and harder to audit.                                        | Added `scripts/data/run-row-count-snapshot.mjs` and `pnpm data:row-counts`.                                                    |

## Data Validation

Run:

```bash
DATABASE_URL=postgresql://localhost:5432/stagelink_test pnpm data:validate
```

Optional JSON artifact:

```bash
mkdir -p data-integrity-results
DATABASE_URL=postgresql://localhost:5432/stagelink_test \
DATA_INTEGRITY_OUTPUT=data-integrity-results/local.json \
pnpm data:validate
```

Production-like URLs are blocked unless explicitly approved:

```bash
DATA_ALLOW_PRODUCTION=true DATABASE_URL=postgresql://... pnpm data:validate
```

Use production validation only during an approved read-only audit window.

### Integrity Checks

The SQL runner reports only failing check groups:

| Check                                          | Severity | Purpose                                                            |
| ---------------------------------------------- | -------- | ------------------------------------------------------------------ |
| `duplicate_user_email_case_insensitive`        | critical | Finds email duplicates that differ only by case.                   |
| `duplicate_artist_username_case_insensitive`   | critical | Finds username duplicates that differ only by case.                |
| `artists_without_page`                         | warning  | Finds artists that never completed page provisioning.              |
| `artists_without_owner_membership`             | critical | Ensures every artist has an owner membership for authorization.    |
| `duplicate_block_positions_per_page`           | warning  | Finds ambiguous public page ordering.                              |
| `subscriber_block_artist_mismatch`             | critical | Ensures subscriber source block belongs to the subscriber artist.  |
| `subscriber_page_artist_mismatch`              | critical | Ensures subscriber source page belongs to the subscriber artist.   |
| `duplicate_subscribers_case_insensitive`       | critical | Finds duplicate fan records per artist by case-insensitive email.  |
| `analytics_block_artist_mismatch`              | critical | Ensures link analytics block attribution does not cross artists.   |
| `multiple_primary_custom_domains_per_artist`   | critical | Enforces one primary custom domain per artist.                     |
| `smart_links_destinations_not_array`           | critical | Validates SmartLink destinations JSON shape.                       |
| `shopify_product_handles_not_array`            | critical | Validates Shopify selected products JSON shape.                    |
| `insights_snapshot_connection_artist_mismatch` | critical | Ensures insights snapshots match their connection artist/platform. |
| `uploaded_assets_without_delivery_url`         | warning  | Finds uploaded assets that cannot be served publicly.              |

The runner uses `psql` when the Postgres CLI is available. If `psql` is not
installed, it falls back to Prisma through the API package dependency so the
same read-only SQL checks can still run from repo-only environments.

## Backup

Dry-run:

```bash
DATABASE_URL=postgresql://... pnpm data:backup:dry-run
```

Execute:

```bash
DATABASE_URL=postgresql://... pnpm data:backup -- --execute --output-dir backups
```

The helper uses:

```bash
pg_dump --format=custom --no-owner --no-acl
```

Backup files are written under `backups/` by default. The directory is ignored
by git. Dry-run output redacts database passwords before printing commands.

## Restore Check

Restore-check must target a disposable database. Local targets are allowed when
the URL contains `localhost` or `127.0.0.1` and a safe database name such as
`stagelink_restore`, `stagelink_test` or `postgres`.

Dry-run:

```bash
TARGET_DATABASE_URL=postgresql://localhost:5432/stagelink_restore \
pnpm data:restore:dry-run -- --backup backups/stagelink-20260501T120000Z.dump
```

Execute restore + integrity validation:

```bash
TARGET_DATABASE_URL=postgresql://localhost:5432/stagelink_restore \
pnpm data:restore:check -- --execute --backup backups/stagelink-20260501T120000Z.dump
```

The helper runs:

```bash
pg_restore --clean --if-exists --no-owner --no-acl --dbname "$TARGET_DATABASE_URL" "$BACKUP_FILE"
DATABASE_URL="$TARGET_DATABASE_URL" node scripts/data/run-data-integrity.mjs
```

Non-local restore targets require explicit approval:

```bash
DATA_ALLOW_NONLOCAL_RESTORE=true TARGET_DATABASE_URL=postgresql://... pnpm data:restore:check -- --execute --backup backups/file.dump
```

Never restore into production from this helper.

## Validation Performed

Commands run locally on 2026-05-01:

```bash
pnpm --filter @stagelink/api exec jest --runTestsByPath src/test/integration-db.spec.ts
bash -n scripts/data/backup-recovery.sh
node --check scripts/data/run-data-integrity.mjs
DATABASE_URL=postgresql://localhost:5432/stagelink_test pnpm data:backup:dry-run
TARGET_DATABASE_URL=postgresql://localhost:5432/stagelink_restore pnpm data:restore:dry-run -- --backup backups/example.dump
pnpm typecheck
```

Results:

- Integration DB reset coverage test passes.
- Backup helper syntax check passes.
- Data integrity runner syntax check passes.
- Backup dry-run prints the expected `pg_dump` command without writing a dump.
- Restore dry-run prints the expected `pg_restore` command and integrity
  validation step without modifying a database.
- TypeScript check passes.

No live backup or restore was executed by this PR.

Final-check Task 6 was recorded on 2026-05-06 in
`docs/final-qa-task-6-restore-drill.md`. Backup/restore dry-runs, secret
redaction and non-local restore guardrails were verified again. The first real
restore drill remains gated on an approved source backup and a disposable
restore database.

Final-check Task 8 was recorded on 2026-05-06 in
`docs/final-qa-task-8-managed-db-backups.md`. Railway managed database backups
are currently disabled because the project is on the Railway Hobby plan. This is
accepted for the current private QA/pre-launch phase and must be revisited in
`T7-8: Lanzamiento productivo, documentación y backlog post-launch`, before
broad public launch or when StageLink reaches the first 100 users.

Final-check Task 9 was recorded on 2026-05-06 in
`docs/final-qa-task-9-row-count-snapshot.md`. The repo now includes
`pnpm data:row-counts`, a read-only snapshot command for comparing critical
table counts before and after a restore drill.

Final-check T09 staging data validation was revisited on 2026-05-07 in
`docs/final-qa-staging-data-validation.md`. The validation tooling is ready, but
Railway currently exposes only the `production` environment for the linked
project. The real staging validation remains blocked until a staging database
exists or Robert explicitly approves a read-only production data audit.

## Manual Staging Checklist

1. Create or identify a disposable restore database.
2. Run `pnpm data:backup -- --execute` against staging during an approved
   maintenance/testing window.
3. Restore the dump into the disposable database with
   `pnpm data:restore:check -- --execute --backup <file>`.
4. Confirm `pnpm data:validate` returns pass on the restored database.
5. Capture and compare row counts with `pnpm data:row-counts`.
6. Archive the backup filename, checksum, restore target, validation JSON and
   row-count snapshots outside git.

## Launch Readiness Criteria

Section 8 is healthy when:

- Integration DB reset coverage remains green.
- `pnpm data:validate` passes against staging, once a staging database exists.
- `pnpm data:row-counts` captures source/target row-count snapshots during
  restore drills.
- Manual backup/restore guardrails remain verified.
- For private QA/pre-launch: managed backup limitations are documented and
  accepted.
- For public launch: managed backups, retention and restore/PITR capability are
  confirmed outside the repo.

## Known Follow-ups

| Priority | Follow-up                                                                                                      | Reason                                                                                               |
| -------- | -------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| P1       | Enable managed database automated backups after Railway Pro upgrade / public launch threshold.                 | Railway Hobby does not currently provide the needed backup feature; revisit in T7-8 or at 100 users. |
| P1       | Run the first staging backup/restore drill after the full testing plan is complete.                            | Tracked in `docs/final-qa-task-6-restore-drill.md`; requires approved source + disposable target DB. |
| P2       | Add checksums and artifact upload for backup/restore drills.                                                   | Makes launch sign-off auditable.                                                                     |
| P3       | Consider case-insensitive DB indexes for emails/usernames if duplicates by case become operationally possible. | Current app normalizes key inputs, but DB-level protection would be stronger.                        |
