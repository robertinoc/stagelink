# Final QA Task 3 - Production Smoke On stagelink.art

Status: implemented
Last checked: 2026-05-02

## Scope

Validate the production smoke suite against the production StageLink domain
after staging E2E has passed.

## Evidence

GitHub Actions run `25250006639` on `main` completed successfully after PR #224.
The production smoke job started only after staging E2E passed.

| Check                    | Result |
| ------------------------ | ------ |
| TypeScript check         | Passed |
| Web unit tests           | Passed |
| API unit tests           | Passed |
| API integration tests    | Passed |
| Build                    | Passed |
| E2E tests (staging)      | Passed |
| Smoke tests (production) | Passed |

Production smoke job details:

- Job: `Smoke tests (production)`
- Job ID: `74040662378`
- Environment: GitHub `production`
- Base URL source: `PRODUCTION_URL` secret
- Command: `pnpm test:e2e:smoke`
- Playwright project: `smoke`
- Result: 3 passed in 4.3s
- Artifact: `smoke-report-25250006639`

## Smoke Coverage

Current smoke coverage is intentionally production-safe and non-mutating:

| Spec                         | Assertion                                                         |
| ---------------------------- | ----------------------------------------------------------------- |
| `e2e/smoke/homepage.spec.ts` | Root URL responds with HTTP 200.                                  |
| `e2e/smoke/homepage.spec.ts` | Landing page renders a visible level-1 heading.                   |
| `e2e/smoke/homepage.spec.ts` | Landing page emits no browser console errors during initial load. |

## Validation

Authoritative validation was the post-merge `main` CI run because the production
URL lives in the GitHub `production` environment.

Manual equivalent:

```bash
PLAYWRIGHT_BASE_URL=https://stagelink.art pnpm test:e2e:smoke
```

## Closure Criteria

Task 3 is closed when this evidence is merged and the latest `main` run has a
green `Smoke tests (production)` job after a green `E2E tests (staging)` job.
