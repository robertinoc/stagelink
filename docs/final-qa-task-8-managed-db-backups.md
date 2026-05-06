# Final QA Task 8: Managed Database Backups

Status: partially resolved / deferred to launch hardening

## Context

This final-check item validates whether StageLink has managed database backups
available in the current Railway/Postgres production setup.

On 2026-05-06 Robert confirmed that Railway managed database backups are not
enabled because the project is currently on the Railway Hobby plan. Backups are
a Railway Pro plan feature in the current setup.

## Decision

StageLink will not enable managed automatic backups during the current private
QA/pre-launch phase.

Managed backups must be revisited and enabled when either of these conditions is
met:

- StageLink is launched publicly for general users.
- StageLink reaches the first 100 users.

This decision should be reviewed during:

- `T7-8: Lanzamiento productivo, documentación y backlog post-launch`
- the final launch readiness pass;
- any infrastructure upgrade from Railway Hobby to Railway Pro.

## Current Protection

The repository already includes manual data reliability tooling:

- `pnpm data:validate`
- `pnpm data:backup:dry-run`
- `pnpm data:backup`
- `pnpm data:restore:dry-run`
- `pnpm data:restore:check`

These commands help validate manual backup and restore readiness, but they are
not a substitute for managed production backups or point-in-time recovery.

## Launch Requirement

Before broad public launch, confirm and document:

1. Railway Pro or equivalent database backup capability is active.
2. Automatic backups are enabled for the production database.
3. Backup retention is known and acceptable.
4. Restore/PITR capability is available and tested against a disposable target.
5. Backup/restore evidence is stored outside git.

## Result

Task 8 is partially resolved for the current phase: the limitation is known,
accepted, and documented. It remains a launch-hardening/backlog requirement for
`T7-8`.
