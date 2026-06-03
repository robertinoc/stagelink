# StageLink — Final QA Task 11: Launch Backlog for T7-8

Status: launch backlog assembled from the Final Check decision register
Last checked: 2026-06-02

## Goal

Convert the Final QA findings into a single, prioritized **Launch Backlog** that
`T7-8: Lanzamiento productivo, documentación y backlog post-launch` can execute
item by item.

`docs/final-qa-task-10-gap-closure.md` recorded the closure map and the launch
decision register (`D1`–`D6`). That document answered "what is the current state
and what was decided." This document answers the next question: **"what exactly
gets done, in what order, gated by what, and how do we know it's finished."**

This task does not run destructive traffic, stress tests, or restore operations.
It produces an actionable, owner-assigned backlog and nothing more.

## How to read this backlog

Each item has:

- **ID** — `LB-#`, stable reference for tracking.
- **Origin** — the Final Check decision (`D1`–`D6`) or runbook section it comes
  from, so the trail back to the evidence is never lost.
- **Owner** — who is accountable. `Robert` for product/infra-account decisions,
  `Engineering` for code/infra execution, or both.
- **Gate** — the trigger that makes this item due. `Before private launch`,
  `Before broad public traffic`, `On approved window`, etc.
- **Priority** — `P1` (launch-blocking for its gate), `P2` (should-do at its
  gate), `P3` (revisit / opportunistic).
- **Status** — `Backlog`, `Ready to execute`, `Blocked`, `Deferred`.

`Gate` matters more than raw priority: a `P1` item gated on
`Before broad public traffic` is not a blocker for a private QA launch.

## Backlog summary

| ID   | Title                                              | Origin | Owner                | Gate                           | Priority | Status           |
| ---- | -------------------------------------------------- | ------ | -------------------- | ------------------------------ | -------- | ---------------- |
| LB-1 | Confirm WorkOS / Radar challenge & abuse posture   | D1     | Robert               | Before broad public traffic    | P1       | Ready to execute |
| LB-2 | Stand up a real staging environment                | D3, D5 | Engineering + Robert | Foundational (unblocks LB-3/6) | P1       | Backlog          |
| LB-3 | Decide DB validation: staging DB vs prod read-only | D5     | Robert + Engineering | Before broad public traffic    | P2       | Blocked on LB-2  |
| LB-4 | Distributed rate limiting (Redis/Upstash/KV)       | D2     | Engineering          | Before broad public traffic    | P1       | Backlog          |
| LB-5 | Railway Pro + managed backups & restore drill      | D6     | Robert + Engineering | Before public launch w/ data   | P1       | Backlog          |
| LB-6 | Re-run clean staging load test                     | D3     | Engineering          | After LB-2                     | P2       | Blocked on LB-2  |
| LB-7 | Decide stress-test timing: pre- vs post- private   | D4     | Robert + Engineering | Decision now, run on window    | P2       | Needs decision   |

## Dependency map

```
LB-2 (real staging)
  ├──> LB-3 (staging DB validation — else fall back to prod read-only audit)
  └──> LB-6 (clean load test re-run with canonical staging URL + API + demo artist)

LB-7 (stress-test timing) ── informs ──> when LB-2 / LB-6 capacity numbers are trusted

LB-1, LB-4, LB-5 are independent and can proceed in parallel.
```

`LB-2` is the keystone: two items are blocked on it. If staging keeps slipping,
`LB-3` has an explicit fallback (production read-only audit) so DB validation is
not held hostage by staging — but `LB-6` cannot be honestly closed without it.

---

## LB-1 — Confirm WorkOS / Radar challenge & abuse posture

- **Origin:** D1 (WorkOS Dashboard Security Confirmation)
- **Owner:** Robert
- **Gate:** Before broad public traffic
- **Priority:** P1

### Context

D1 confirmed (2026-05-07) the production/staging callbacks, sign-out, login
endpoint, auth methods, sessions, bot detection and brute-force protection.
Global MFA is intentionally off for the current phase. What remains for launch
hardening is the **abuse / challenge** posture under real signup traffic.

### Action

1. Review the WorkOS **Radar** (bot/abuse challenge) configuration for the
   production environment: confirm what triggers a challenge, and that it does
   not break the legitimate signup → `ensureProfile` flow.
2. Confirm brute-force and credential-stuffing thresholds are appropriate for a
   public signup form (not just the private-QA assumption).
3. Re-decide MFA for `admin` / `operator` / `behind.stagelink.art` access — the
   recommended posture before broad public launch.

### Acceptance criteria

- Radar / challenge behavior is documented (what it does, when it fires).
- A decision is recorded on admin/operator/behind MFA (enabled, or explicitly
  deferred with a date).
- If MFA is enabled anywhere, the authenticated E2E strategy
  (`E2E_AUTH_EMAIL` / `E2E_AUTH_PASSWORD`) is updated first so it does not break
  — see the D1 warning in task-10.

### Notes

External dashboard policy — no repo code change expected. The risk is enabling
MFA without updating the E2E auth flow.

---

## LB-2 — Stand up a real staging environment

- **Origin:** D3 (Staging Load Test) + D5 (Staging Data Validation)
- **Owner:** Engineering + Robert
- **Gate:** Foundational — unblocks LB-3 and LB-6
- **Priority:** P1

### Context

Both the load test (D3) and the data validation (D5) were degraded by the same
root cause: there is no canonical staging environment.

- `https://staging.stagelink.link` returned Vercel `404 DEPLOYMENT_NOT_FOUND`.
- The Railway project has only a `production` environment — no staging DB.

The load test was run against an ad-hoc Vercel Preview with Preview Auth
temporarily disabled, which is why point 7 closed "with warning" and not as a
canonical staging sign-off.

### Action

1. Assign `staging.stagelink.link` to the intended staging Vercel deployment
   (stop relying on disposable Preview URLs).
2. Create a Railway `staging` environment with its own database, separate from
   `production`.
3. Seed a known **demo artist** in staging for the load-test route mix and for
   manual QA.
4. Wire the staging API URL so `PERF_API_URL` and `DATABASE_URL` point at
   staging, not at a Preview or production.

### Acceptance criteria

- `staging.stagelink.link` serves the intended deployment (no 404).
- A Railway `staging` DB exists and is reachable via a secured env path.
- A seeded demo artist is published in staging.
- The staging web + API URLs are captured for `PERF_WEB_URL` / `PERF_API_URL`.

### Notes

This is the keystone item. LB-3 and LB-6 stay blocked or compromised until this
lands.

---

## LB-3 — Decide DB validation: staging DB vs production read-only audit

- **Origin:** D5 (Staging Data Validation)
- **Owner:** Robert + Engineering
- **Gate:** Before broad public traffic
- **Priority:** P2
- **Blocked on:** LB-2

### Context

`pnpm data:validate` tooling is ready. D5 left two valid paths:

- run it against a **staging DB** (preferred — non-destructive, no prod risk), or
- run a **production read-only audit** with explicit Robert approval, if staging
  is not ready in time.

### Action

1. If LB-2 delivered a staging DB → run validation against staging.
2. If staging is still missing at the gate → run the production read-only audit
   **with explicit Robert approval**, treating it strictly as read-only QA.

Ready command:

```bash
DATABASE_URL=<target-database-url> \
DATA_INTEGRITY_OUTPUT=data-integrity-results/<env>-YYYYMMDD.json \
pnpm data:validate
```

### Acceptance criteria

- A validation run exists with its JSON artifact stored **outside git** or
  attached to the release record.
- The chosen path (staging vs production read-only) is recorded with the date
  and, if production, the approval.
- The DB URL was provided through a secure shell/env path, never pasted into a
  doc or chat.

---

## LB-4 — Distributed rate limiting (Redis / Upstash / Vercel KV)

- **Origin:** D2 (Rate Limiting for Launch)
- **Owner:** Engineering
- **Gate:** Before broad public traffic / paid acquisition / multi-instance scale
- **Priority:** P1

### Context

Current limiters (`checkRateLimit()` on web, `PublicRateLimitGuard` /
`UploadRateLimitGuard` on API) are **in-memory and instance-local** — accepted
for private QA, not safe once multiple instances run or public traffic arrives.
Upstash already powers `behind.stagelink.art` roles but does not yet back the
public/upload/SmartLink limits.

### Action

Migrate the public-facing limiters to a shared atomic store (Redis / Upstash /
Vercel KV). Pull this forward only if broad public traffic, paid campaigns, or
abusive traffic arrive before T7-8.

### Acceptance criteria (from D2)

- web `checkRateLimit()` uses a shared atomic store;
- API `PublicRateLimitGuard` and `UploadRateLimitGuard` use the same shared store
  or a clearly equivalent API-side limiter;
- tests cover quota enforcement, namespace isolation, and multi-instance-safe key
  generation;
- staging validates controlled `429` responses before production rollout
  (depends on LB-2 for a clean staging target).

---

## LB-5 — Railway Pro + managed backups & first restore drill

- **Origin:** D6 (Backup / Restore Drill)
- **Owner:** Robert + Engineering
- **Gate:** Before public launch with meaningful user data / ~first 100 users
- **Priority:** P1

### Context

Railway managed backups are disabled on the current Hobby plan. Repo tooling for
dry-run, backup generation, restore-check, and row-count snapshots is ready, but
no real drill has run because there is no disposable restore DB and no managed
backups.

### Action

1. Upgrade Railway to **Pro** and enable managed backups for the production DB.
2. Provision a **disposable** restore database (never restore into production).
3. Run the first real backup → restore-check → row-count drill on an approved
   window.

Real drill gate (from D6):

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

### Acceptance criteria

- Railway Pro is active and managed backups are enabled + verified.
- One successful restore drill into a **disposable** DB is recorded, with the
  restore-check and row-count artifacts stored outside git.
- The runbook explicitly states: never restore into production from the helper.

---

## LB-6 — Re-run a clean staging load test

- **Origin:** D3 (Staging Load Test)
- **Owner:** Engineering
- **Gate:** After LB-2
- **Priority:** P2
- **Blocked on:** LB-2

### Context

The recorded run had 0% request failures and no `5xx`, but warm p95 was
`1026 ms` vs the `1000 ms` target, and it ran against an ad-hoc Vercel Preview,
not canonical staging. The number is therefore indicative, not a sign-off.

### Action

Re-run `pnpm perf:load` against canonical staging once LB-2 is done.

```bash
PERF_WEB_URL=<staging-web-url> \
PERF_API_URL=<staging-api-url> \
PERF_DEMO_ARTIST=<seeded-demo-artist> \
PERF_OUTPUT=performance-results/staging-load-YYYYMMDD.json \
pnpm perf:load
```

### Acceptance criteria

- The run targets `staging.stagelink.link` + the staging API + a seeded demo
  artist (i.e. truly LB-2, not a Preview).
- Results captured; warm p95 re-measured against the `1000 ms` target.
- If p95 still misses, a follow-up perf item is opened rather than silently
  accepting it.
- The output artifact is stored outside git or attached to the release record.

---

## LB-7 — Decide stress-test timing: before or after private launch

- **Origin:** D4 (Controlled Stress Test)
- **Owner:** Robert + Engineering
- **Gate:** Decision now; execution on an approved window
- **Priority:** P2
- **Status:** Needs decision

### Context

Real stress testing remains deferred and must not run against production or
staging casually. It needs an approved window, open monitoring, and a
stop/rollback condition. What's missing is not tooling — it's a **decision** on
_when_: before the private launch, or after.

### Decision to record

Choose one and write it down with a date:

- **Option A — before private launch:** validate capacity headroom before any
  real users arrive. Costs schedule time; needs LB-2 (staging) to avoid hitting
  production.
- **Option B — after private launch:** ship the private launch on the existing
  load-test evidence (LB-6) and schedule the stress test before the _broader_
  public push.

### Recommendation

**Option B.** The private launch is low-traffic and gated by the trial model;
the clean load test (LB-6) is enough signal for it. Schedule the controlled
stress test in the window between private launch and broad public traffic, once
LB-2 staging and LB-4 distributed rate limiting are in place — so the stress run
actually exercises the production-like limiter, not the in-memory one.

### Acceptance criteria

- A dated decision (A or B) is recorded here.
- If B, a named trigger exists ("before broad public traffic" / "before paid
  acquisition") so it does not get silently skipped.
- Whenever it runs: approved window + monitoring open + stop/rollback condition,
  per D4.

---

## What this task closes

- The Final Check decisions (`D1`–`D6`) are now an executable, owner-assigned,
  gated backlog (`LB-1`–`LB-7`) instead of a decision narrative.
- Dependencies are explicit: `LB-2` is the keystone; `LB-3` and `LB-6` are
  blocked on it; `LB-3` has a production read-only fallback.
- Each item has a concrete acceptance criterion, so "done" is unambiguous.
- `T7-8` can pick this up and work it top-to-bottom.

## Recommended execution order for T7-8

1. **LB-2** (real staging) — unblocks the most.
2. In parallel: **LB-1** (WorkOS/Radar), **LB-4** (distributed rate limiting),
   **LB-5** (Railway Pro + backups) — independent, all P1 for public traffic.
3. After LB-2: **LB-3** (DB validation) and **LB-6** (clean load test).
4. **LB-7** — record the stress-test timing decision now; execute on an approved
   window after LB-2 + LB-4.

## Source documents

- `docs/final-qa-task-10-gap-closure.md` — closure map + decision register
  (`D1`–`D6`).
- `docs/launch-readiness.md` — operational runbook (Sentry, DB password rotation,
  uptime alerting, Supabase capacity, final smoke test).
- `docs/final-qa-staging-load-test.md` — recorded load-test evidence.
- `docs/final-qa-staging-data-validation.md` — staging DB blocker detail.
- `docs/final-qa-task-5-stress-test-window.md` — stress-test gating.
- `docs/final-qa-task-6-restore-drill.md` — backup/restore drill gating.
- `docs/final-qa-task-8-managed-db-backups.md` — managed backups context.
