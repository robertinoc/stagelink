# StageLink — QA Testing Infrastructure

Status: partial / needs follow-up
Last checked: 2026-04-29

This document tracks the actual testing infrastructure currently present in the
repo. It is intentionally factual: it separates what runs locally today from the
pieces that were scaffolded but are not yet wired into package scripts.

## Prompt Coverage

Original setup request:

- Unit testing (Jest or similar)
- Integration testing
- E2E testing (Playwright or Cypress)
- Folder structure
- Base config files
- Ensure everything runs locally

## Current Status

| Area              | Status                              | Notes                                                                                                                                                                       |
| ----------------- | ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| API unit tests    | Implemented and running             | NestJS/Jest suite passes locally.                                                                                                                                           |
| Web unit tests    | Wired, no component tests yet       | `apps/web/vitest.config.ts`, `vitest.setup.ts`, scripts, and dependencies are present. `passWithNoTests` keeps this non-blocking until real component tests land.           |
| Integration tests | Not implemented as a distinct layer | Existing Jest specs cover service/helper behavior. No DB-backed integration suite is configured yet.                                                                        |
| E2E tests         | Wired                               | `playwright.config.ts`, `e2e/**/*.spec.ts`, root scripts, and `@playwright/test` are present. Browser binaries still need `pnpm playwright:install` in a fresh environment. |
| Folder structure  | Partially implemented               | API specs live beside source files; E2E has `e2e/smoke`, `e2e/public`, `e2e/artist`, `e2e/auth`; web test folder convention is configured but no tests exist yet.           |
| CI                | Wired                               | `.github/workflows/ci.yml` runs typecheck, API coverage, web coverage, build, staging E2E, and production smoke using package scripts.                                      |

## Folder Structure

```text
apps/api/
  jest.config.ts
  src/**/*.spec.ts

apps/web/
  vitest.config.ts
  vitest.setup.ts
  src/**/__tests__/**/*.test.{ts,tsx}  # configured convention

e2e/
  auth/*.setup.ts
  smoke/*.spec.ts
  public/*.spec.ts
  artist/*.spec.ts

.github/workflows/
  ci.yml
```

## API Unit Testing

Tooling:

- Jest
- ts-jest
- NestJS testing utilities

Config:

- `apps/api/jest.config.ts`
- Test files: `apps/api/src/**/*.spec.ts`

Current local command:

```bash
pnpm --filter @stagelink/api test
```

Last local result:

```text
Test Suites: 22 passed, 22 total
Tests:       213 passed, 213 total
```

Known issue:

- Jest reports a worker forced exit after the suite, likely from active timers
  in scheduler-related tests. The tests pass, but this should be cleaned up
  before treating the suite as launch-grade.

## Web Unit Testing

Intended tooling:

- Vitest
- React Testing Library
- jsdom
- `@testing-library/jest-dom`

Config files currently present:

- `apps/web/vitest.config.ts`
- `apps/web/vitest.setup.ts`

Configured test convention:

```text
apps/web/src/**/__tests__/**/*.test.{ts,tsx}
```

Current gap:

- `apps/web/package.json` exposes `test`, `test:coverage`, and `test:ci`.
- Vitest, Testing Library, jsdom, and the V8 coverage provider are configured.
- The config uses `passWithNoTests: true`, so the first phase can land before
  component tests exist, but CI should not interpret that as real web coverage.

## Integration Testing

Current status:

- No separate integration-test command exists.
- No test database bootstrap/reset flow is wired.
- Existing Jest specs mock collaborators and are best classified as unit tests.

Recommended next step:

- Add a NestJS integration layer under either `apps/api/test/integration` or
  `apps/api/src/**/*.integration-spec.ts`.
- Use a dedicated test database and run Prisma migrations before the suite.
- Cover auth guard behavior, ownership checks, billing entitlement gates,
  public page reads, subscriber writes, and upload-intent validation.

## E2E Testing

Intended tooling:

- Playwright

Config and specs currently present:

- `playwright.config.ts`
- `e2e/smoke/homepage.spec.ts`
- `e2e/public/artist-page.spec.ts`
- `e2e/artist/dashboard.spec.ts`
- `e2e/artist/page-editor.spec.ts`
- `e2e/auth/auth.setup.ts`

Current gap:

- Root `package.json` exposes `test:e2e`, `test:e2e:smoke`, and
  `playwright:install`.
- `@playwright/test` is installed as a root dev dependency.
- Auth setup is still a placeholder until staging test credentials are
  available.

Recommended scripts:

```json
{
  "test:api": "pnpm --filter @stagelink/api test",
  "test:web": "pnpm --filter @stagelink/web test",
  "test:e2e": "playwright test",
  "test:e2e:smoke": "playwright test --project=smoke",
  "playwright:install": "playwright install --with-deps chromium"
}
```

## Environments

| Environment | Purpose               | Notes                                                                                                                            |
| ----------- | --------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Local       | Developer feedback    | Web on `http://localhost:4000`, API on `http://localhost:4001`.                                                                  |
| Staging     | Release candidate QA  | Should use `staging.stagelink.link` for the web app and a staging Railway API/database.                                          |
| Production  | Smoke-only validation | Use only non-mutating smoke tests and monitoring. Canonical domain is `https://stagelink.link`; `stagelink.art` redirects to it. |

## Local Run Status

Commands checked on 2026-04-29:

| Command                          | Result                                                                                                                          |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `CI=true pnpm test:api:coverage` | Passes and writes `apps/api/coverage/coverage-summary.json` plus `apps/api/test-results/junit.xml`.                             |
| `CI=true pnpm test:web:coverage` | Passes with no component tests yet and writes `apps/web/coverage/coverage-summary.json` plus `apps/web/test-results/junit.xml`. |
| `pnpm typecheck`                 | Passes.                                                                                                                         |
| `pnpm test:e2e:smoke`            | Passes locally after `pnpm playwright:install`.                                                                                 |
| `pnpm build`                     | Passes with CI placeholder auth environment variables.                                                                          |

## Completion Criteria

This setup task should be considered complete only after:

- Root and workspace package scripts match CI.
- Vitest dependencies and scripts are present in `apps/web/package.json`.
- Playwright dependency and root scripts are present in `package.json`.
- Smoke E2E runs locally against `localhost:4000`.
- CI passes typecheck, API tests, web tests, build, and staging E2E.
- Integration tests have a documented scope and at least one DB-backed suite.
