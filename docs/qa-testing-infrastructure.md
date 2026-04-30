# StageLink — QA Testing Infrastructure

Status: complete for base infrastructure
Last checked: 2026-04-30

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

| Area              | Status                             | Notes                                                                                                                                                                                                          |
| ----------------- | ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| API unit tests    | Implemented and running            | NestJS/Jest suite passes locally with service, helper, utility, webhook, scheduler and error-path coverage.                                                                                                    |
| Web unit tests    | Implemented and running            | Vitest + React Testing Library are configured and now include component tests under `apps/web/src/**/__tests__`.                                                                                               |
| Integration tests | Implemented as dedicated API layer | `pnpm test:api:integration` runs NestJS + Prisma integration specs against PostgreSQL. CI provisions a Postgres 16 service and applies migrations before the suite.                                            |
| E2E tests         | Expanded                           | Playwright now has smoke, auth UI, public business journeys, mobile public journeys and credential-gated authenticated journeys. Browser binaries still need `pnpm playwright:install` in a fresh environment. |
| Folder structure  | Implemented                        | API specs live beside source files; web component tests live under `apps/web/src/**/__tests__`; E2E has `e2e/smoke`, `e2e/public`, `e2e/artist`, `e2e/auth`.                                                   |
| CI                | Wired                              | `.github/workflows/ci.yml` runs typecheck, API coverage, web coverage, build, staging E2E, and production smoke using package scripts.                                                                         |

## Folder Structure

```text
apps/api/
  jest.config.ts
  src/**/*.spec.ts

apps/web/
  vitest.config.ts
  vitest.setup.ts
  src/**/__tests__/**/*.test.{ts,tsx}

e2e/
  auth/*.setup.ts
  auth/*.spec.ts
  business/*.spec.ts
  critical/*.spec.ts
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

Last local result after Section 3.3 async-flow expansion:

```text
Test Suites: 26 passed, 26 total
Tests:       246 passed, 246 total
```

Section 3.3 added focused async-flow coverage for Stripe webhooks, retry
signaling, scheduled StageLink Insights jobs and stale/error sync retry
eligibility.

## Web Unit Testing

Tooling:

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

Current status:

- `apps/web/package.json` exposes `test`, `test:coverage`, and `test:ci`.
- Vitest, Testing Library, jsdom, and the V8 coverage provider are configured.
- Component tests now cover shared empty states, FAQ toggles, auth form rendering
  and onboarding form interactions.
- The config keeps `passWithNoTests: true` so empty future slices do not block
  the whole workspace, but web coverage is no longer an empty shell.

Last local result after Section 2 unit-test expansion:

```text
Test Files: 5 passed
Tests:      15 passed
```

## Integration Testing

Current status:

- A separate API integration command exists: `pnpm test:api:integration`.
- Integration specs use the `apps/api/src/**/*.integration-spec.ts` convention.
- The CI workflow provisions PostgreSQL, runs Prisma migrations, and executes
  the integration suite before the build job.
- The DB-backed suite validates onboarding, tenant resolution, public page
  loading, localized block output, custom-domain resolution, and analytics
  persistence.
- The API contract suite validates all current API routes for success status,
  authentication, representative authorization, DTO validation, malformed IDs,
  content types, and shared error-envelope consistency.
- Async-flow tests validate Stripe webhook idempotency/retry behavior and the
  current StageLink Insights scheduler/job processor. There is no dedicated
  queue worker yet; queue-specific tests should be added when that
  infrastructure exists.

Current command:

```bash
pnpm test:api:integration
```

Recommended next integration targets:

- Billing entitlement gates.
- Subscriber writes.
- Upload-intent validation.
- Dedicated queue worker behavior once StageLink introduces a queue backend.

## E2E Testing

Intended tooling:

- Playwright

Config and specs currently present:

- `playwright.config.ts`
- `e2e/auth/login-signup.spec.ts`
- `e2e/business/public-business-journey.spec.ts`
- `e2e/critical/artist-onboarding-upload-navigation.spec.ts`
- `e2e/smoke/homepage.spec.ts`
- `e2e/public/artist-page.spec.ts`
- `e2e/artist/dashboard.spec.ts`
- `e2e/artist/page-editor.spec.ts`
- `e2e/auth/auth.setup.ts`

Current status:

- Root `package.json` exposes `test:e2e`, `test:e2e:smoke`, and
  `playwright:install`.
- `@playwright/test` is installed as a root dev dependency.
- WorkOS-backed authenticated journeys are enabled only when `E2E_AUTH_EMAIL`
  and `E2E_AUTH_PASSWORD` are configured.
- Mutating onboarding/upload journeys are guarded by `E2E_RUN_ONBOARDING=true`
  and `E2E_RUN_UPLOAD=true`.

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

Commands checked on 2026-04-30:

| Command                          | Result                                                                                                                     |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `CI=true pnpm test:api:coverage` | Passes and writes `apps/api/coverage/coverage-summary.json` plus `apps/api/test-results/junit.xml`.                        |
| `CI=true pnpm test:web:coverage` | Passes with component tests and writes `apps/web/coverage/coverage-summary.json`, `coverage-final.json`, and JUnit output. |
| `pnpm typecheck`                 | Passes.                                                                                                                    |
| `pnpm test:e2e:smoke`            | Passes locally after `pnpm playwright:install`.                                                                            |
| `pnpm build`                     | Passes with CI placeholder auth environment variables.                                                                     |

## Completion Criteria

This setup task should be considered complete only after:

- Root and workspace package scripts match CI.
- Vitest dependencies and scripts are present in `apps/web/package.json`.
- Playwright dependency and root scripts are present in `package.json`.
- Smoke E2E runs locally against `localhost:4000`.
- CI passes typecheck, API tests, web tests, build, and staging E2E.
- Integration tests have a documented scope and at least one DB-backed suite.

Section 2 unit-test expansion is tracked in:

- `docs/unit-testing-section-2.md`

Section 3 integration-test expansion is tracked in:

- `docs/integration-api-testing-section-3.md`

Section 4 E2E expansion is tracked in:

- `docs/e2e-testing-section-4.md`
