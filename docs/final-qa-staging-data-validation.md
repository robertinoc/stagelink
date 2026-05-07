# StageLink — Final QA Staging Data Validation

Status: blocked on staging database availability
Last checked: 2026-05-07

## Goal

Run T09 from the Final Check list:

```text
Run staging data validation
```

This check is intended to be read-only. It validates data integrity,
consistency and duplicate risks through `pnpm data:validate`.

## What Was Checked

Railway CLI authentication was refreshed by Robert on 2026-05-07.

After login, the linked Railway project was inspected:

- project: `trustworthy-blessing`;
- linked environment: `production`;
- service: `stagelink`;
- database service: `Postgres`;
- available Railway environments: `production` only.

No Railway `staging` environment/database was available, so the staging
validation could not be run as originally scoped.

## Decision

T09 is not failed. It is blocked because the target environment does not exist
in Railway yet.

Do not run this check against production unless Robert explicitly approves a
read-only production data audit window.

## Safe Execution Options

### Option A — Preferred: Create Staging DB

Create a Railway staging environment with a staging Postgres database. Then run:

```bash
railway run --environment staging --service stagelink --no-local -- \
  sh -c 'DATA_INTEGRITY_OUTPUT=/tmp/stagelink-staging-data-validation.json pnpm data:validate'
```

Expected result:

```text
StageLink data integrity: pass (0 findings)
```

If findings appear, review `docs/data-reliability-section-8.md` for severity
and remediation order.

### Option B — Explicit Approval Required: Production Read-Only Audit

If there is still no staging database and Robert wants production data checked
before launch, run only after explicit approval:

```bash
railway run --environment production --service stagelink --no-local -- \
  sh -c 'DATA_ALLOW_PRODUCTION=true DATA_INTEGRITY_OUTPUT=/tmp/stagelink-production-data-validation.json pnpm data:validate'
```

This command is read-only, but it touches the production database and therefore
requires owner approval.

## Tooling Hardening

The data integrity runner now supports two execution paths:

1. `psql`, when the local Postgres client is installed;
2. Prisma fallback, when `psql` is not available.

This keeps T09 runnable from laptops and CI environments that already have the
repo dependencies installed but do not have the Postgres CLI installed.

## Current Follow-Ups

| Priority | Follow-up                                                                                   | Owner       |
| -------- | ------------------------------------------------------------------------------------------- | ----------- |
| P1       | Decide whether to create a Railway staging database now or defer it to `T7-8`.              | Robert      |
| P1       | If staging DB is created, run `pnpm data:validate` against staging and document the result. | Engineering |
| P1       | If production audit is desired instead, approve a read-only production data validation run. | Robert      |
| P2       | Archive the JSON output outside git after the first successful run.                         | Engineering |
