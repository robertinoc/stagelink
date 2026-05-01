# StageLink — UAT & Final QA Section 9

Status: implemented for UAT coverage and final pre-release checklist
Last checked: 2026-05-01

This document records the Section 9 final QA work:

- 9.1 UAT testing: simulate real users, full platform usage, friction findings
- 9.2 Final QA + smoke pre-release: smoke, critical flows, regression and
  production readiness

## Scope

Section 9 is the release-candidate layer that sits above the focused sections:

- Sections 1-4: base QA, unit, integration/API and E2E
- Section 6: security
- Section 7: performance
- Section 8: data/reliability

The goal is not to duplicate every test. The goal is to run the right
combination, capture friction, and produce a human-readable sign-off.

## Fixes Applied

| Finding                                                                                                                 | Impact                                                               | Fix                                                                                                  |
| ----------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Accessibility specs existed under `e2e/accessibility`, but `playwright.config.ts` did not register them in any project. | Accessibility regression tests were not executed by `pnpm test:e2e`. | Added `accessibility-public` and credential-gated `accessibility-authenticated` Playwright projects. |
| Accessibility specs imported `@axe-core/playwright`, but the root dev dependency was missing.                           | Enabling the specs would fail in CI.                                 | Added `@axe-core/playwright` as a root dev dependency.                                               |
| No UAT-specific E2E project existed.                                                                                    | Real-user friction checks were buried inside lower-level E2E suites. | Added `e2e/uat/real-user-journey.spec.ts` and included it in the public UAT project.                 |
| No final QA command existed.                                                                                            | Pre-release validation required remembering several project names.   | Added `pnpm test:e2e:uat` and `pnpm test:e2e:final`.                                                 |

## UAT Coverage

Automated UAT file:

```text
e2e/uat/real-user-journey.spec.ts
```

Covered journeys:

| User        | Journey                            | Coverage                                                                    |
| ----------- | ---------------------------------- | --------------------------------------------------------------------------- |
| New artist  | Landing → pricing → signup → login | Ensures offer discovery and account entry points are reachable.             |
| Fan/visitor | Public artist page inspection      | Ensures a demo public profile renders and exposes actionable content links. |

Manual UAT should still be run with real users or the product owner because
friction, wording and trust cues are partly subjective.

## Commands

UAT:

```bash
E2E_DEMO_ARTIST=free-artist-qa pnpm test:e2e:uat
```

Final pre-release public/non-mutating pass:

```bash
E2E_DEMO_ARTIST=free-artist-qa pnpm test:e2e:final
```

Full staging E2E including authenticated flows:

```bash
PLAYWRIGHT_BASE_URL=https://staging.stagelink.link \
E2E_DEMO_ARTIST=free-artist-qa \
E2E_AUTH_EMAIL=artist-e2e@example.com \
E2E_AUTH_PASSWORD=... \
pnpm test:e2e
```

Production smoke only:

```bash
PLAYWRIGHT_BASE_URL=https://stagelink.art pnpm test:e2e:smoke
```

## Playwright Projects

| Project                       | Auth               | Purpose                                  |
| ----------------------------- | ------------------ | ---------------------------------------- |
| `smoke`                       | No                 | Production-safe smoke checks.            |
| `auth-ui`                     | No                 | StageLink-owned login/signup entry UI.   |
| `public`                      | No                 | Public page, business and UAT journeys.  |
| `mobile`                      | No                 | Responsive public regression.            |
| `accessibility-public`        | No                 | Public WCAG/keyboard checks.             |
| `setup`                       | WorkOS credentials | Auth state setup.                        |
| `authenticated`               | WorkOS credentials | Dashboard, onboarding/upload/navigation. |
| `accessibility-authenticated` | WorkOS credentials | Dashboard a11y/keyboard checks.          |

If `E2E_AUTH_EMAIL` and `E2E_AUTH_PASSWORD` are absent, authenticated projects
are intentionally not registered.

## UAT Friction Report Template

Use this table during manual UAT:

| ID      | Persona | Flow               | Friction / Issue    | Severity | Evidence        | Owner | Status |
| ------- | ------- | ------------------ | ------------------- | -------- | --------------- | ----- | ------ |
| UAT-001 | Artist  | Signup → dashboard | Example placeholder | P2       | screenshot/link | TBD   | open   |

Severity:

- P0: blocks launch
- P1: critical workflow broken or data/security risk
- P2: meaningful friction or confusing UX
- P3: polish/follow-up

## Final QA Gate

Before release candidate sign-off:

| Gate             | Required evidence                                                                                                                   |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| CI               | Latest `main` or release PR has green typecheck, API tests, web tests, integration tests and build.                                 |
| E2E              | Staging `pnpm test:e2e` passes, with auth-gated projects enabled if credentials are configured.                                     |
| Production smoke | `pnpm test:e2e:smoke` passes against `https://stagelink.art`.                                                                       |
| UAT              | Manual UAT issue table reviewed; no open P0/P1.                                                                                     |
| Security         | Section 6 checklist complete, including WorkOS brute-force settings.                                                                |
| Performance      | Section 7 load/scalability complete; real stress deferred to approved window.                                                       |
| Data/reliability | Section 8 validation complete; real restore drill deferred until the full testing plan is complete unless a disposable DB is ready. |
| Documentation    | `CLAUDE.md` and section docs reflect latest commands, known risks and follow-ups.                                                   |

## Final QA Regression Matrix

| Area                 | Automated coverage                                    | Manual confirmation                           |
| -------------------- | ----------------------------------------------------- | --------------------------------------------- |
| Landing/auth entry   | `auth-ui`, `uat`, `smoke`                             | Copy, trust, CTA clarity                      |
| Public artist page   | `public`, `mobile`, `uat`                             | Real content quality, booking/contact clarity |
| Dashboard navigation | `authenticated`                                       | Sidebar, settings, billing visibility         |
| Onboarding/upload    | `authenticated` with flags                            | Only with reset/new test account              |
| Accessibility        | `accessibility-public`, `accessibility-authenticated` | Keyboard pass on staging                      |
| Security             | Section 6 tests/docs                                  | WorkOS/provider settings                      |
| Performance          | Section 7 runner/docs                                 | Monitoring during approved windows            |
| Data/recovery        | Section 8 runner/docs                                 | Backup/restore evidence                       |

## Validation Performed

Commands run locally on 2026-05-01:

```bash
pnpm --filter @stagelink/web test
pnpm --filter @stagelink/api exec jest --runTestsByPath src/test/integration-db.spec.ts
pnpm typecheck
CI=true PLAYWRIGHT_OUTPUT_DIR=/tmp/stagelink-section9-results \
  PLAYWRIGHT_HTML_REPORT=/tmp/stagelink-section9-report \
  pnpm exec playwright test --list --project=auth-ui --project=public --project=mobile --project=accessibility-public
CI=true PLAYWRIGHT_OUTPUT_DIR=/tmp/stagelink-section9-auth-results \
  PLAYWRIGHT_HTML_REPORT=/tmp/stagelink-section9-auth-report \
  E2E_AUTH_EMAIL=placeholder@example.com E2E_AUTH_PASSWORD=placeholder \
  pnpm exec playwright test --list --project=accessibility-authenticated
CI=true PLAYWRIGHT_OUTPUT_DIR=/tmp/stagelink-section9-final-results \
  PLAYWRIGHT_HTML_REPORT=/tmp/stagelink-section9-final-report \
  pnpm exec playwright test --list --project=smoke --project=auth-ui --project=public --project=mobile --project=accessibility-public
```

Results:

- Web unit tests pass: 13 files, 131 tests.
- Integration DB reset coverage passes.
- TypeScript check passes.
- Playwright lists `test:e2e:uat` coverage: 24 tests across auth UI, public,
  mobile and public accessibility projects.
- Playwright lists credential-gated authenticated accessibility coverage: 12
  tests across setup, dashboard axe and dashboard keyboard projects.
- Playwright lists `test:e2e:final` coverage: 27 non-mutating tests including
  smoke, UAT and public accessibility.

No production mutation was performed by this PR.

## Known Follow-ups

| Priority | Follow-up                                                                                                                       | Reason                                                                                                  |
| -------- | ------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| P0       | Keep `main` green after the Section 9 merge.                                                                                    | Tracked in `docs/final-qa-task-1-main-green.md`; staging E2E must pass before production smoke can run. |
| P1       | Run full staging `pnpm test:e2e` with WorkOS credentials before final launch sign-off.                                          | Authenticated projects are credential-gated.                                                            |
| P1       | Run manual UAT with at least one artist/operator persona and record issues in the template.                                     | Automated checks do not fully measure friction or comprehension.                                        |
| P1       | Keep the Section 7 real stress test deferred until the full testing plan is complete, with approved window and monitoring open. | Avoid accidental production/staging disruption.                                                         |
| P1       | Run the first Section 8 restore drill only after the full testing plan is complete and against a disposable restore DB.         | Avoid destructive recovery operations during active QA.                                                 |
| P2       | Add a GitHub Actions manual workflow for final QA evidence artifacts.                                                           | Simplifies release sign-off history.                                                                    |
