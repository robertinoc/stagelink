# Final QA Task 2 - Full Staging E2E With WorkOS

Status: implemented
Last checked: 2026-05-02

## Scope

Run the full staging E2E suite with WorkOS-backed authenticated projects enabled
and confirm the app is ready to continue the final check sequence.

## Evidence

GitHub Actions run `25239555370` on `main` completed successfully after PR #223.

| Check                    | Result |
| ------------------------ | ------ |
| TypeScript check         | Passed |
| Web unit tests           | Passed |
| API unit tests           | Passed |
| API integration tests    | Passed |
| Build                    | Passed |
| E2E tests (staging)      | Passed |
| Smoke tests (production) | Passed |

The staging E2E job received the credential-gated environment variables:

- `PLAYWRIGHT_BASE_URL`
- `E2E_DEMO_ARTIST`
- `E2E_AUTH_EMAIL`
- `E2E_AUTH_PASSWORD`
- `E2E_RUN_ONBOARDING`
- `E2E_RUN_UPLOAD`

The run executed 47 Playwright tests. Final result: 39 passed, 7 skipped, 1
flaky setup retry.

## Finding

The WorkOS setup project authenticated successfully after retry, but the first
attempt timed out with:

```text
Hosted auth did not complete before timeout.
```

The root cause was in the test helper, not in the GitHub environment secrets:
the invalid-credentials branch of `Promise.race` resolved to `null` after 10
seconds when no invalid-credentials message appeared. That could make a slow but
valid WorkOS redirect look like a failed authentication attempt.

## Fix

- Increased the auth setup budget from 90s to 120s.
- Increased the WorkOS redirect wait from 60s to 90s.
- Changed the invalid-credentials branch so it only wins the race if the invalid
  credentials message actually appears.

## Validation

Commands run locally:

```bash
pnpm typecheck
CI=true PLAYWRIGHT_OUTPUT_DIR=/tmp/stagelink-task2-auth-list-results \
  PLAYWRIGHT_HTML_REPORT=/tmp/stagelink-task2-auth-list-report \
  E2E_AUTH_EMAIL=placeholder@example.com E2E_AUTH_PASSWORD=placeholder \
  pnpm exec playwright test --list --project=setup --project=authenticated --project=accessibility-authenticated
git diff --check
```

Authoritative validation remains the post-merge `main` CI run because the real
WorkOS credentials live in the GitHub `staging` environment.

## Closure Criteria

Task 2 is closed when the follow-up PR is merged and the next `main` CI run
passes staging E2E with authenticated projects enabled.
