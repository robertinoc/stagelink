# StageLink — Final QA Task 10: Gap Closure & Launch Decisions

Status: implemented as final-check closure map and launch-decision register
Last checked: 2026-05-07

## Goal

Close the Final Check section by separating completed QA evidence from launch
decisions that intentionally remain outside automated tests.

This task does not run destructive production traffic, stress tests or database
restore operations. It records the current state, names the remaining gates and
keeps the next owner actions explicit before `T7-8: Lanzamiento productivo,
documentación y backlog post-launch`.

## Final Check Closure Map

| #   | Final-check item                              | Status                 | Evidence / Decision                                                                                                                                          |
| --- | --------------------------------------------- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | Verify/restore `main` after Section 9 merge   | DONE                   | `docs/final-qa-task-1-main-green.md`; `main` was recovered and kept green after the Section 9 merge sequence.                                                |
| 2   | Run full staging E2E with WorkOS credentials  | DONE                   | `docs/final-qa-task-2-staging-e2e-workos.md`; authenticated staging E2E runs were enabled through GitHub staging secrets.                                    |
| 3   | Run production smoke tests on `stagelink.art` | DONE                   | `docs/final-qa-task-3-production-smoke.md`; production smoke coverage targets the canonical production domain.                                               |
| 4   | Run manual UAT with artist/operator persona   | DONE                   | `docs/final-qa-task-4-manual-uat.md`; UAT-006 was manually approved with no open P0/P1 issue at sign-off.                                                    |
| 5   | Review WorkOS security settings               | DONE with note         | Robert confirmed production/staging callbacks, sign-out, login endpoint, auth methods, sessions, bot detection and brute-force protection on 2026-05-07.     |
| 6   | Decide launch rate-limiting posture           | DONE with decision     | In-memory app rate limiting is accepted for private QA/pre-launch; shared Redis/Upstash rate limiting is deferred to `T7-8` before sustained public traffic. |
| 7   | Run staging load test                         | DONE with warning      | `docs/final-qa-staging-load-test.md`; Vercel Preview stayed stable at 0% errors, but warm p95 was 1026 ms and canonical staging was not assigned.            |
| 8   | Run controlled stress test                    | Intentionally deferred | `docs/final-qa-task-5-stress-test-window.md`; no real stress run until an approved window and monitoring are open.                                           |
| 9   | Run staging data validation                   | Ready to execute       | Tooling exists in `pnpm data:validate`; real staging run requires secure staging `DATABASE_URL` access and read-only approval.                               |
| 10  | Run backup/restore drill with disposable DB   | Intentionally deferred | `docs/final-qa-task-6-restore-drill.md`; real drill needs approved source backup and a disposable restore database.                                          |
| 11  | Final Check Gap Closure & Launch Decisions    | DONE with decision log | This document records the final-check status map, launch decisions, warnings and explicitly deferred work for `T7-8`.                                        |

## Status Legend

| Status                 | Meaning                                                                                            |
| ---------------------- | -------------------------------------------------------------------------------------------------- |
| DONE                   | The task was executed and closed without an open launch caveat.                                    |
| DONE with note         | The task is closed, but there is an important operational note to preserve for launch hardening.   |
| DONE with decision     | The task is closed because a conscious launch decision was made and documented.                    |
| DONE with warning      | The task ran and showed acceptable stability, but left a measurable caveat that should be tracked. |
| DONE with decision log | The task closes the final-check register by documenting decisions, caveats and remaining gates.    |
| Ready to execute       | Tooling exists and the next step is to run it with approved environment access.                    |
| Intentionally deferred | The task is not failed or forgotten; it is postponed on purpose until required conditions exist.   |

`Intentionally deferred` is used for checks that should not be executed casually.
For StageLink, this currently applies to destructive or infrastructure-dependent
work: real stress testing and real backup/restore drills. These remain valid
launch-readiness items, but they require an approved window, monitoring and/or
disposable infrastructure before execution.

## Done With Notes, Decisions And Warnings

| Task | Classification         | Recorded outcome                                                                                                                                                               | Priority to revisit                                                        |
| ---- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------- |
| T05  | DONE with note         | WorkOS redirect/callbacks, auth methods, sessions, bot detection and brute-force protection were confirmed. Global MFA remains intentionally off for the current launch phase. | Revisit MFA in `T7-8` for admin/operator/behind access.                    |
| T06  | DONE with decision     | Keep in-memory rate limiting for private QA/pre-launch. Move public/API/upload/SmartLink limits to Redis/Upstash/Vercel KV before sustained public traffic.                    | High before broad public traffic or paid acquisition.                      |
| T07  | DONE with warning      | Light load on Vercel Preview had 0% errors and no `5xx`, but warm p95 was `1026 ms` vs the `1000 ms` target; canonical staging was not assigned.                               | High once staging URL/API/demo artist are ready.                           |
| T08  | Intentionally deferred | Real stress testing was not run because it requires an approved window, monitoring and stop/rollback conditions.                                                               | Medium; run before larger launch or traffic push.                          |
| T10  | Intentionally deferred | Real backup/restore drill was not run because Railway managed backups are unavailable on the Hobby plan and a disposable restore DB is required.                               | High before public launch with meaningful user data, or after Railway Pro. |
| T11  | DONE with decision log | Final Check now has an explicit closure map, launch decisions, caveats and deferred gates ready for `T7-8`.                                                                    | Use as input to `T7-8`.                                                    |

## Launch Decision Register

### D1 — WorkOS Dashboard Security Confirmation

Owner: Robert

Decision needed before broad public launch:

- production redirect/callback URLs include the canonical `https://stagelink.art`
  auth callback;
- staging redirect/callback URLs remain configured for QA;
- brute-force, bot/challenge or abuse protections are enabled according to the
  WorkOS project policy;
- MFA policy is intentionally set for the current launch phase;
- session duration and inactivity behavior match the desired user experience.

Repo status: no code change required in this task. StageLink validates WorkOS
session consumption, protected API access and callback behavior, but the
provider dashboard policy is external to the repo.

Decision recorded on 2026-05-07:

- production and staging WorkOS environments were reviewed by Robert;
- canonical `stagelink.art`, staging, sign-out and login redirects were
  confirmed;
- Google, Email + Password and Magic Auth are enabled;
- session settings were confirmed;
- bot detection and brute-force attack protection are enabled;
- global MFA remains off intentionally for the current launch phase.

MFA is not a launch blocker for the current private QA/MVP phase. Revisit MFA in
`T7-8`, with a preference for requiring MFA on admin/operator/behind access
before broad public launch. Do not enable global MFA without updating the
authenticated E2E strategy because mandatory MFA can break the
`E2E_AUTH_EMAIL`/`E2E_AUTH_PASSWORD` setup flow.

### D2 — Rate Limiting for Launch

Owner: Robert + Engineering

Current state:

- API public endpoints, upload intents, SmartLink redirects and contact-style
  routes have application-level rate limits.
- The current limiters are in-memory and therefore instance-local.
- In-memory rate limiting is acceptable for private QA and low-traffic MVP use
  if the risk is explicitly accepted.
- Upstash Redis is already used by the internal `behind.stagelink.art` role
  system, but only for that operational dashboard. It does not yet make
  public/upload/SmartLink rate limits distributed.

Decision recorded on 2026-05-07:

- Keep in-memory rate limiting for private QA/pre-launch.
- Add Redis/Upstash/Vercel KV-backed shared rate limiting before sustained
  public marketing traffic, paid acquisition or any launch where multiple
  scaled instances are expected.
- Track the Redis/Upstash migration in `T7-8`.
- Pull the migration forward only if StageLink will receive broad public
  traffic, paid campaigns or abusive traffic before `T7-8`.

Acceptance criteria for a future Redis/Upstash rate-limit migration:

- web `checkRateLimit()` uses a shared atomic store;
- API `PublicRateLimitGuard` and `UploadRateLimitGuard` use the same shared
  store or a clearly equivalent API-side limiter;
- tests cover quota enforcement, namespace isolation and multi-instance-safe key
  generation;
- staging validates controlled `429` responses before production rollout.

### D3 — Staging Load Test

Owner: Engineering, with Robert approval

Ready command:

```bash
PERF_WEB_URL=<staging-web-url> \
PERF_API_URL=<staging-api-url> \
PERF_DEMO_ARTIST=<seeded-demo-artist> \
PERF_OUTPUT=performance-results/staging-load-YYYYMMDD.json \
pnpm perf:load
```

Run only after:

- staging frontend/API URLs are confirmed;
- staging has a seeded public artist used by the route mix;
- Railway/Vercel dashboards are open or at least watched after the run;
- the output artifact is stored outside git or attached to the release record.

Decision recorded on 2026-05-07:

- `https://staging.stagelink.link` returned Vercel
  `404 DEPLOYMENT_NOT_FOUND`;
- Robert temporarily disabled Vercel Preview Authentication so QA traffic could
  reach the selected Preview deployment;
- Codex ran `pnpm perf:load` against the latest relevant Vercel Preview
  deployment;
- the valid run and warm rerun both had 0% request failures and no observed
  `5xx` responses;
- the warm run missed the p95 threshold by 26 ms: p95 `1026 ms` versus the
  `1000 ms` load target;
- Point 3 is accepted as executed with warning, not as a full canonical staging
  sign-off.

For the next true staging run, execute only after:

- `staging.stagelink.link` points to the intended staging deployment;
- a seeded demo artist exists in staging;
- the staging API/Railway URL is included through `PERF_API_URL`.

### D4 — Controlled Stress Test

Owner: Robert + Engineering

Decision:

- Real stress testing remains deferred.
- It must not run against production or staging casually.
- It should run only during an approved test window with monitoring open and a
  rollback/stop condition.

This matches the existing Section 7 note: no real stress traffic was sent to
staging or production during the testing plan.

### D5 — Staging Data Validation

Owner: Engineering, with Robert approval for DB access

Ready command:

```bash
DATABASE_URL=<staging-database-url> \
DATA_INTEGRITY_OUTPUT=data-integrity-results/staging-YYYYMMDD.json \
pnpm data:validate
```

Run only after:

- the database URL is provided through a secure shell/environment path, not
  pasted into project docs;
- the run is approved as read-only QA;
- the JSON result is stored outside git or attached to the release record.

### D6 — Backup / Restore Drill

Owner: Robert + Engineering

Decision:

- The first real restore drill remains deferred until a disposable restore
  database exists.
- Railway managed backups are disabled on the current Hobby plan and will be
  revisited in `T7-8`, at broad public launch or around the first 100 users.
- Repo tooling is ready for dry-run, backup command generation, restore-check
  validation and row-count snapshots.

Real drill gate:

```bash
DATABASE_URL=<approved-source-db-url> \
pnpm data:backup -- --execute --output-dir backups

TARGET_DATABASE_URL=<disposable-restore-db-url> \
DATA_INTEGRITY_OUTPUT=data-integrity-results/restore-YYYYMMDD.json \
pnpm data:restore:check -- --execute --backup backups/<dump-file>.dump

DATABASE_URL=<disposable-restore-db-url> \
DATA_ROW_COUNTS_OUTPUT=data-integrity-results/restore-row-counts-YYYYMMDD.json \
pnpm data:row-counts
```

Never restore into production from the helper.

## What This Task Closes

- The Final Check section now has an explicit status map for all ten items.
- Deferred items are no longer ambiguous: stress and restore are gated by
  approval, monitoring and disposable infrastructure.
- Launch decisions are named and ready for owner-by-owner confirmation.
- `T7-8` has a clear intake list for production launch documentation and
  post-launch backlog.

## Next Recommended Sequence

After this PR is merged:

1. Run a light staging load test if staging URLs and monitoring are ready.
2. Run staging data validation if secure DB access is available.
3. Keep real stress and backup/restore drill deferred unless Robert creates an
   approved window and disposable restore database.
