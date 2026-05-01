# Final QA Task 1 - Main Green Recovery

Status: implemented
Last checked: 2026-05-01

## Scope

Verify and restore the health of `main` after merging the Section 9 UAT and
final QA coverage PR.

## Finding

After PR #220 was merged, GitHub Actions run `25234917477` on `main` passed
TypeScript, API unit tests, web unit tests, API integration tests and build.
The staging E2E job failed, which caused production smoke tests to be skipped.

## Failed Checks And Resolutions

| Area                        | Failure                                                                                        | Resolution                                                                                                        |
| --------------------------- | ---------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Authenticated accessibility | Settings route had two `[aria-current="page"]` links, one parent and one active child.         | Narrowed the assertion to the active plans/billing sidebar link.                                                  |
| UAT public artist journey   | Demo artist page could render without published public links.                                  | Kept the real-user coverage but skips only the link assertion when the selected demo profile has no public links. |
| Public keyboard navigation  | Landing keyboard test did not tab far enough to reach login/signup targets.                    | Expanded focus traversal and validated both label text and `href` targets.                                        |
| Public WCAG AA              | Axe reported color contrast violations in footer section labels and the landing preview label. | Raised footer label contrast and changed the preview label to an accessible foreground color.                     |

## Validation

Commands run locally:

```bash
pnpm typecheck
pnpm --filter @stagelink/web test
CI=true PLAYWRIGHT_OUTPUT_DIR=/tmp/stagelink-task1-list-results \
  PLAYWRIGHT_HTML_REPORT=/tmp/stagelink-task1-list-report \
  E2E_AUTH_EMAIL=placeholder@example.com E2E_AUTH_PASSWORD=placeholder \
  pnpm exec playwright test --list --project=public --project=accessibility-public --project=accessibility-authenticated
```

Results:

- TypeScript check passed.
- Web unit tests passed: 13 files, 131 tests.
- Playwright listed 30 tests across public, public accessibility and
  authenticated accessibility projects.

Local execution of browser E2E against `https://stagelink.art` was blocked by
the local sandbox browser launcher permission, not by a StageLink application
error. The authoritative validation for this task is the PR CI run and the
follow-up `main` run after merge.

## Merge Validation Required

After this PR is merged:

1. Confirm the `main` GitHub Actions run starts.
2. Confirm staging E2E passes.
3. Confirm production smoke tests run and pass.

Only after those checks pass should Task 1 be considered fully closed and Task
2 begin.
