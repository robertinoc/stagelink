# Final QA Task 5 - Stress Test Window Deferral

Status: implemented as controlled deferral
Last checked: 2026-05-02

## Scope

Close the final-check item for Section 7 real stress testing without running
unapproved stress traffic against staging or production.

This task confirms that the repo has repeatable performance tooling, production
guardrails, and a documented protocol for the later real stress window.

## Decision

Real stress testing remains deferred until there is:

- an approved test window;
- Railway, Vercel and database monitoring open;
- an identified target environment;
- a rollback/stop owner present;
- a place to archive JSON results and provider screenshots outside git.

No live stress test was run against staging or production during this task.

## Guardrail Evidence

Commands run on 2026-05-02:

```bash
PERF_WEB_URL=https://stagelink.art \
PERF_DEMO_ARTIST=free-artist-qa \
pnpm perf:stress -- --dry-run
```

Result: blocked with the expected guardrail message because production-like
targets require `PERF_ALLOW_PROD_STRESS=true`.

```bash
PERF_WEB_URL=https://stagelink.art \
PERF_DEMO_ARTIST=free-artist-qa \
pnpm perf:scalability -- --dry-run
```

Result: blocked with the expected guardrail message because production-like
targets require `PERF_ALLOW_PROD_STRESS=true`.

```bash
PERF_WEB_URL=https://stagelink.art \
PERF_DEMO_ARTIST=free-artist-qa \
pnpm perf:load -- --dry-run
```

Result: allowed and printed the non-mutating launch-load route plan.

```bash
PERF_ALLOW_PROD_STRESS=true \
PERF_WEB_URL=https://stagelink.art \
PERF_DEMO_ARTIST=free-artist-qa \
pnpm perf:stress -- --dry-run
```

Result: allowed and printed the stress route plan without sending traffic.

## Approved Window Protocol

Before running real stress:

1. Pick target: staging first; production only after launch DNS and monitoring
   are stable.
2. Confirm `PERF_WEB_URL`, `PERF_API_URL` and `PERF_DEMO_ARTIST`.
3. Open Vercel, Railway and database monitoring dashboards.
4. Create output directory outside git or under ignored `performance-results/`.
5. Announce start time, expected duration and stop owner.
6. Run the command.
7. Stop immediately on sustained 5xx, DB connection exhaustion, memory pressure
   or user-facing degradation.
8. Archive JSON result plus provider screenshots.

Staging command:

```bash
PERF_WEB_URL=https://staging.stagelink.link \
PERF_API_URL=<staging-api-url> \
PERF_DEMO_ARTIST=free-artist-qa \
PERF_OUTPUT=performance-results/staging-stress-YYYYMMDD.json \
pnpm perf:stress
```

Production command, only during approved window:

```bash
PERF_ALLOW_PROD_STRESS=true \
PERF_WEB_URL=https://stagelink.art \
PERF_API_URL=<production-api-url> \
PERF_DEMO_ARTIST=free-artist-qa \
PERF_OUTPUT=performance-results/production-stress-YYYYMMDD.json \
pnpm perf:stress
```

## Closure Criteria

Task 5 is closed when:

- production stress/scalability guardrails are verified;
- the real stress test remains explicitly deferred;
- the later execution protocol is documented;
- Section 9 references this task as the owner of the deferral.
