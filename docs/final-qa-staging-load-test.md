# StageLink — Final QA Staging Load Test

Status: executed with performance warning
Last checked: 2026-05-07

## Goal

Record the Final Check staging load test evidence after Task 10.

This run validates light anonymous web traffic stability. It is not a full
staging sign-off because the canonical staging domain and staging API target
were not available during the run.

## Target Used

| Setting            | Value                                                                                |
| ------------------ | ------------------------------------------------------------------------------------ |
| `PERF_WEB_URL`     | `https://stagelink-git-codex-final-q-c65bb9-robertinos-projects-6b8eadf7.vercel.app` |
| `PERF_API_URL`     | Not set                                                                              |
| `PERF_DEMO_ARTIST` | `free-artist-qa`                                                                     |
| Profile            | `load`                                                                               |
| Shape              | 20 virtual users for 30 seconds                                                      |

Scope:

- web-only Vercel Preview traffic;
- anonymous public routes only;
- home page and public artist route mix;
- no authenticated flow;
- no Railway API load;
- no stress or scalability profile.

## Preflight

The intended staging domain was checked first:

```bash
curl -I https://staging.stagelink.link
```

Result: Vercel returned `404 DEPLOYMENT_NOT_FOUND`, so the domain was not used
as the load target.

The latest relevant Vercel Preview deployment was then used. It initially
returned Vercel Authentication `401/403`; Robert temporarily disabled Vercel
Preview Authentication for the QA run.

After that change:

- `/` redirected to `/en` and returned `200`;
- `/free-artist-qa` redirected to `/en/free-artist-qa` and returned `404`;
- the `404` artist response is accepted by the runner, but it means this was
  not a seeded demo-artist content validation.

Robert should re-enable Vercel Preview Authentication after evidence collection
if Preview deploys should remain private.

## Commands

Dry-run:

```bash
pnpm perf:load -- \
  --web-url https://stagelink-git-codex-final-q-c65bb9-robertinos-projects-6b8eadf7.vercel.app \
  --demo-artist free-artist-qa \
  --dry-run
```

Sandboxed run was discarded because the local sandbox could not resolve the
Vercel host and produced `getaddrinfo ENOTFOUND`. The valid run was executed
with normal network access:

```bash
pnpm perf:load -- \
  --web-url https://stagelink-git-codex-final-q-c65bb9-robertinos-projects-6b8eadf7.vercel.app \
  --demo-artist free-artist-qa \
  --output /tmp/stagelink-preview-load-20260507-escalated.json
```

Warm rerun:

```bash
pnpm perf:load -- \
  --web-url https://stagelink-git-codex-final-q-c65bb9-robertinos-projects-6b8eadf7.vercel.app \
  --demo-artist free-artist-qa \
  --output /tmp/stagelink-preview-load-20260507-warm.json
```

## Results

First valid run:

| Metric        | Result                 |
| ------------- | ---------------------- |
| Passed        | No                     |
| Requests      | 684                    |
| Failures      | 0                      |
| Error rate    | 0%                     |
| p50           | 883.38 ms              |
| p95           | 1092.87 ms             |
| p99           | 2637.58 ms             |
| Max           | 3664.27 ms             |
| Approx RPS    | 22.1                   |
| Status counts | `200`: 260, `404`: 424 |

Warm rerun:

| Metric        | Result                 |
| ------------- | ---------------------- |
| Passed        | No                     |
| Requests      | 724                    |
| Failures      | 0                      |
| Error rate    | 0%                     |
| p50           | 879.12 ms              |
| p95           | 1026 ms                |
| p99           | 1417.15 ms             |
| Max           | 1608.53 ms             |
| Approx RPS    | 23.43                  |
| Status counts | `200`: 271, `404`: 453 |

## Interpretation

Stable behavior observed:

- no failed HTTP statuses according to the runner;
- no `5xx` responses;
- no obvious rate-limit storm;
- no crash or outage under the light 20-VU profile.

Performance warning:

- the `load` profile threshold is p95 <= 1000 ms;
- the warm rerun produced p95 `1026 ms`, 26 ms over threshold;
- this should be treated as a launch warning, not a P0/P1 blocker for private
  QA.

Staging-readiness gaps:

- `https://staging.stagelink.link` is not assigned to an active deployment;
- no staging API/Railway URL was included through `PERF_API_URL`;
- `free-artist-qa` was not seeded on the tested Preview deployment.

## Decision

Point 3 was executed with warning.

StageLink showed acceptable light-load stability on Vercel Preview, but the
result is not a clean full staging sign-off. A true staging load test should be
rerun after the staging domain, staging API target and seeded demo artist are
confirmed.

## Follow-ups

| Priority | Follow-up                                                                                         | Reason                                                                    |
| -------- | ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| P1       | Assign `https://staging.stagelink.link` to an active staging/preview deployment.                  | The current domain returned Vercel `DEPLOYMENT_NOT_FOUND`.                |
| P1       | Identify or seed the staging demo artist used by load tests.                                      | `free-artist-qa` returned `404` on the tested Preview deployment.         |
| P1       | Confirm staging API/Railway URL and rerun with `PERF_API_URL`.                                    | This run was web-only and did not exercise API load.                      |
| P2       | Investigate public-page latency if p95 remains above 1000 ms on real staging.                     | Warm preview p95 was 1026 ms.                                             |
| P2       | Re-enable Vercel Preview Authentication after QA evidence if Preview deploys should stay private. | It was temporarily disabled to allow the load runner to reach the deploy. |
