# StageLink — Performance Testing Section 7

Status: implemented for repeatable load/stress/scalability runs
Last checked: 2026-05-01

This document records the Section 7 performance testing work:

- 7.1 Load testing: multiple users and API stress under expected launch traffic
- 7.2 Stress testing: breakpoint and failure behavior under excessive traffic
- 7.3 Scalability testing: latency/throughput curve as traffic increases

## Tooling Decision

StageLink now includes a dependency-free Node.js performance runner:

```text
scripts/performance/run-performance.mjs
```

Why this approach:

- No new package or external binary is required.
- It runs anywhere the monorepo already runs: local, CI job, staging shell, or a
  laptop during a release window.
- It is intentionally HTTP-level and black-box: it measures the deployed user
  experience across Vercel + Railway, not only isolated functions.
- It has a built-in production-stress guard so destructive profiles cannot hit
  production-like URLs without explicit approval.

Future upgrade path: if StageLink needs distributed load from multiple regions,
move these scenarios to k6 Cloud, Grafana k6, Artillery Cloud, or a managed
synthetic testing provider.

## Scripts

Root package scripts:

```bash
pnpm perf:load
pnpm perf:stress
pnpm perf:scalability
```

Equivalent direct usage:

```bash
node scripts/performance/run-performance.mjs --profile load
node scripts/performance/run-performance.mjs --profile stress
node scripts/performance/run-performance.mjs --profile scalability
```

Dry-run plan:

```bash
PERF_WEB_URL=http://localhost:4000 \
PERF_API_URL=http://localhost:4001 \
PERF_DEMO_ARTIST=free-artist-qa \
pnpm perf:load -- --dry-run
```

JSON artifact:

```bash
mkdir -p performance-results
PERF_WEB_URL=https://staging.stagelink.link \
PERF_API_URL=https://staging-api.example.com \
PERF_DEMO_ARTIST=free-artist-qa \
PERF_OUTPUT=performance-results/load-staging.json \
pnpm perf:load
```

`performance-results/` is ignored by git.

## Environment Variables

| Variable                 | Required                          | Purpose                                                                   |
| ------------------------ | --------------------------------- | ------------------------------------------------------------------------- |
| `PERF_WEB_URL`           | Optional if `PERF_API_URL` exists | Web base URL, for example `http://localhost:4000` or staging frontend.    |
| `PERF_API_URL`           | Optional if `PERF_WEB_URL` exists | API base URL, for example `http://localhost:4001` or staging Railway API. |
| `PERF_DEMO_ARTIST`       | Recommended                       | Public artist username used for public page and public API probes.        |
| `PERF_SMART_LINK_ID`     | Optional                          | SmartLink CUID used for redirect/resolve probes.                          |
| `PERF_AUTH_TOKEN`        | Optional                          | Bearer token used to include `GET /api/auth/me` in the route mix.         |
| `PERF_OUTPUT`            | Optional                          | JSON file path for the full performance result.                           |
| `PERF_ALLOW_PROD_STRESS` | Only for approved windows         | Must be `true` before stress/scalability can target production-like URLs. |

The runner sends `X-SL-QA: 1` and `StageLinkPerformanceTest/1.0` user-agent on
public visitor routes so analytics can identify test traffic.

## Profiles

| Profile       | Traffic shape                       | Threshold                        | Intended environment                                            |
| ------------- | ----------------------------------- | -------------------------------- | --------------------------------------------------------------- |
| `load`        | 20 virtual users for 30 seconds     | error rate <= 1%, p95 <= 1000 ms | Local, staging, controlled production smoke                     |
| `stress`      | 10 -> 25 -> 50 -> 100 virtual users | error rate <= 5%, p95 <= 2500 ms | Local or staging only unless explicitly approved                |
| `scalability` | 5 -> 20 -> 50 virtual users         | error rate <= 3%, p95 <= 1800 ms | Staging capacity curve, production only during approved windows |

## Route Mix

The route mix is weighted toward real StageLink launch paths:

| Route                                          | Included when                         | Expected statuses   |
| ---------------------------------------------- | ------------------------------------- | ------------------- |
| `GET /` web home                               | `PERF_WEB_URL`                        | `200`               |
| `GET /{username}` public artist page           | `PERF_WEB_URL` + `PERF_DEMO_ARTIST`   | `200`, `404`        |
| `GET /go/{smartLinkId}` SmartLink redirect     | `PERF_WEB_URL` + `PERF_SMART_LINK_ID` | `302`, `404`, `429` |
| `GET /api/health`                              | `PERF_API_URL`                        | `200`               |
| `GET /api/public/pages/by-username/{username}` | `PERF_API_URL` + `PERF_DEMO_ARTIST`   | `200`, `404`, `429` |
| `GET /api/public/epk/by-username/{username}`   | `PERF_API_URL` + `PERF_DEMO_ARTIST`   | `200`, `404`, `429` |
| `GET /api/public/smart-links/{id}/resolve`     | `PERF_API_URL` + `PERF_SMART_LINK_ID` | `200`, `404`, `429` |
| `GET /api/auth/me`                             | `PERF_API_URL` + `PERF_AUTH_TOKEN`    | `200`               |

## What Is Measured

For each run:

- total requests
- failures and error rate
- HTTP status counts
- per-route request counts
- min, average, p50, p95, p99 and max latency
- approximate requests per second
- pass/fail against the selected profile threshold

## Local Validation Performed

Validated on 2026-05-01:

```bash
PERF_WEB_URL=http://localhost:4000 \
PERF_API_URL=http://localhost:4001 \
PERF_DEMO_ARTIST=free-artist-qa \
pnpm perf:load -- --dry-run

PERF_WEB_URL=https://stagelink.link \
pnpm perf:stress -- --dry-run
```

Results:

- Load dry-run prints the configured web/API route plan successfully.
- Stress dry-run against production-like URLs is blocked unless
  `PERF_ALLOW_PROD_STRESS=true` is explicitly set.
- A 300 ms smoke run against an ephemeral local HTTP server completed
  successfully with 2 virtual users, 0 failures and passing thresholds.

No unapproved live stress test was run against production from this PR.

## Execution Plan

### Local Baseline

1. Start local infra:

```bash
cd infra/docker && docker compose up -d
pnpm --filter @stagelink/api db:migrate
pnpm --filter @stagelink/api db:seed
pnpm dev
```

2. Run:

```bash
PERF_WEB_URL=http://localhost:4000 \
PERF_API_URL=http://localhost:4001 \
PERF_DEMO_ARTIST=free-artist-qa \
PERF_OUTPUT=performance-results/local-load.json \
pnpm perf:load
```

3. Pass criteria:

- p95 <= 1000 ms
- error rate <= 1%
- no unexpected 5xx responses

### Staging Load + Scalability

1. Confirm staging has seeded/demo public artist data.
2. Run:

```bash
PERF_WEB_URL=https://staging.stagelink.link \
PERF_API_URL=https://staging-api.example.com \
PERF_DEMO_ARTIST=free-artist-qa \
PERF_OUTPUT=performance-results/staging-load.json \
pnpm perf:load
```

3. Run scalability curve:

```bash
PERF_WEB_URL=https://staging.stagelink.link \
PERF_API_URL=https://staging-api.example.com \
PERF_DEMO_ARTIST=free-artist-qa \
PERF_OUTPUT=performance-results/staging-scalability.json \
pnpm perf:scalability
```

4. Compare p95/p99 and failures across the 5, 20 and 50 VU stages.

### Staging Stress

Run only during a planned test window:

```bash
PERF_WEB_URL=https://staging.stagelink.link \
PERF_API_URL=https://staging-api.example.com \
PERF_DEMO_ARTIST=free-artist-qa \
PERF_OUTPUT=performance-results/staging-stress.json \
pnpm perf:stress
```

Capture:

- first stage where p95 exceeds threshold
- first stage with sustained 5xx responses
- whether rate limiting returns controlled `429` rather than unbounded 5xx
- Railway CPU/memory, DB CPU/connections and Vercel function duration

## Findings / Fixes From Section 7

| Finding                                               | Impact                                                                         | Fix in this PR                                                           |
| ----------------------------------------------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------ |
| No repeatable performance runner existed in the repo. | Load/stress/scalability testing was manual and not comparable across releases. | Added `scripts/performance/run-performance.mjs` and root scripts.        |
| Stress testing could accidentally target production.  | Risk of harming launch traffic or analytics.                                   | Added production-like URL guard for `stress` and `scalability`.          |
| Performance artifacts had no documented location.     | Results could leak into commits or be lost.                                    | Added `performance-results/` to `.gitignore` and documented JSON output. |
| StageLink lacked a Section 7 execution record.        | Launch checklist had no formal performance evidence path.                      | Added this document and linked it from `CLAUDE.md` and QA docs.          |

## Launch Readiness Criteria

Section 7 is healthy when:

- `pnpm perf:load` passes against staging.
- `pnpm perf:scalability` produces an acceptable latency curve in staging.
- Any `pnpm perf:stress` failures are controlled: graceful `429`/timeouts, no
  persistent 5xx cascade, and services recover without manual DB repair.
- Production receives only a short, approved load smoke after launch DNS and
  monitoring are stable.
- Railway/Vercel resource graphs are archived together with the JSON result
  files outside git.

## Known Follow-ups

| Priority | Follow-up                                                                | Reason                                                                     |
| -------- | ------------------------------------------------------------------------ | -------------------------------------------------------------------------- |
| P1       | Replace in-memory rate limiters with Redis/Upstash before high traffic.  | Multi-instance deployments cannot coordinate current per-process counters. |
| P1       | Decide final staging API URL and update the examples above.              | Current deploy docs still describe a future dedicated staging Railway API. |
| P2       | Add CI/manual workflow artifact upload for `performance-results/*.json`. | Makes launch sign-off easier to audit.                                     |
| P2       | Add authenticated dashboard route mix using a dedicated QA bearer token. | Current runner supports it, but tokens should not be stored in repo.       |
| P3       | Consider regional/load-cloud tooling once marketing traffic grows.       | Local single-machine load cannot model global network behavior.            |
