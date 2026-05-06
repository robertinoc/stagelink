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
| Security tests    | Implemented                        | Section 6 adds API contract security probes, API/web rate-limit regression tests, and CUID validation fixes for public SmartLinks and subscriber routes.                                                       |
| Performance tests | Implemented as manual QA tooling   | Section 7 adds a dependency-free Node runner for load, stress and scalability profiles with thresholds, JSON output and production-stress guardrails.                                                          |
| Data reliability  | Implemented as manual QA tooling   | Section 8 adds SQL data integrity checks, backup/restore dry-runs, restore-check validation and integration reset coverage against the Prisma schema.                                                          |
| UAT / final QA    | Implemented                        | Section 9 adds public UAT journeys, accessibility Playwright projects, and final pre-release smoke commands for release readiness.                                                                             |
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
  src/lib/__tests__/rate-limit.test.ts

e2e/
  auth/*.setup.ts
  auth/*.spec.ts
  accessibility/*.spec.ts
  business/*.spec.ts
  critical/*.spec.ts
  smoke/*.spec.ts
  public/*.spec.ts
  artist/*.spec.ts
  uat/*.spec.ts

.github/workflows/
  ci.yml

scripts/
  performance/run-performance.mjs
  data/data-integrity.sql
  data/run-data-integrity.mjs
  data/backup-recovery.sh
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
pnpm --filter @stagelink/api exec jest --runTestsByPath src/common/guards/rate-limit.guard.spec.ts
```

Last focused local result after Section 6 security expansion:

```text
Rate-limit guard specs: 2 passed
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

Section 6 also adds `apps/web/src/lib/__tests__/rate-limit.test.ts` for the
shared web limiter used by `/go/[id]` and landing contact abuse protection.

## Performance Testing

Current status:

- Root scripts expose `pnpm perf:load`, `pnpm perf:stress`, and
  `pnpm perf:scalability`.
- The runner uses only Node.js built-ins and can target local, staging, or an
  approved production window.
- Stress/scalability profiles refuse to hit production-like URLs unless
  `PERF_ALLOW_PROD_STRESS=true` is explicitly set.
- JSON artifacts can be written with `PERF_OUTPUT`; `performance-results/` is
  ignored by git.

Current commands:

```bash
PERF_WEB_URL=http://localhost:4000 PERF_API_URL=http://localhost:4001 pnpm perf:load
PERF_WEB_URL=https://staging.stagelink.link PERF_API_URL=https://staging-api.example.com pnpm perf:scalability
```

Section 7 performance testing is tracked in:

- `docs/performance-testing-section-7.md`

## Data Reliability Testing

Current status:

- Root scripts expose `pnpm data:validate`, `pnpm data:backup:dry-run`,
  `pnpm data:backup`, `pnpm data:restore:dry-run`, and
  `pnpm data:restore:check`.
- `scripts/data/data-integrity.sql` checks integrity, consistency and duplicate
  conditions across core StageLink tables.
- `scripts/data/backup-recovery.sh` defaults to dry-run and refuses unsafe
  restore targets unless explicitly approved.
- Integration DB reset now truncates every mapped Prisma model table, and
  `apps/api/src/test/integration-db.spec.ts` verifies the reset list stays
  aligned with the schema.

Current commands:

```bash
DATABASE_URL=postgresql://localhost:5432/stagelink_test pnpm data:validate
DATABASE_URL=postgresql://localhost:5432/stagelink_test pnpm data:backup:dry-run
TARGET_DATABASE_URL=postgresql://localhost:5432/stagelink_restore pnpm data:restore:dry-run -- --backup backups/example.dump
```

Section 8 data/reliability testing is tracked in:

- `docs/data-reliability-section-8.md`

## UAT & Final QA Testing

Current status:

- Root scripts expose `pnpm test:e2e:uat` and `pnpm test:e2e:final`.
- UAT automation lives in `e2e/uat/real-user-journey.spec.ts`.
- Playwright now registers public and authenticated accessibility projects, so
  the existing axe/keyboard specs are not left outside the runnable suite.
- Final QA remains a release gate: automated checks must be paired with manual
  UAT issue review before launch sign-off.
- Manual final QA evidence artifacts can be captured from GitHub Actions with
  the `Final QA Evidence` workflow.

Current commands:

```bash
E2E_DEMO_ARTIST=free-artist-qa pnpm test:e2e:uat
PLAYWRIGHT_BASE_URL=https://stagelink.art pnpm test:e2e:final
PLAYWRIGHT_BASE_URL=https://stagelink.art pnpm test:e2e:smoke
```

Section 9 UAT/final QA testing is tracked in:

- `docs/uat-final-qa-section-9.md`

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
- Section 6 extends the API contract suite with security probes for malformed
  public SmartLink IDs, XSS/SQLi-style public event payloads, and forbidden
  fields on protected DTOs.
- Async-flow tests validate Stripe webhook idempotency/retry behavior and the
  current StageLink Insights scheduler/job processor. There is no dedicated
  queue worker yet; queue-specific tests should be added when that
  infrastructure exists.

Current command:

```bash
pnpm test:api:integration
pnpm --filter @stagelink/api exec jest --config ./jest.integration.config.ts --runInBand src/test/api-contract.integration-spec.ts
```

Last focused local result after Section 6:

```text
API contract: 145 passed
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

- Root `package.json` exposes `test:e2e`, `test:e2e:smoke`, `test:e2e:uat`,
  `test:e2e:final`, and `playwright:install`.
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
  "test:e2e:uat": "playwright test --project=auth-ui --project=public --project=mobile --project=accessibility-public",
  "test:e2e:final": "playwright test --project=smoke --project=auth-ui --project=public --project=mobile --project=accessibility-public",
  "playwright:install": "playwright install --with-deps chromium"
}
```

## Environments

| Environment | Purpose               | Notes                                                                                          |
| ----------- | --------------------- | ---------------------------------------------------------------------------------------------- |
| Local       | Developer feedback    | Web on `http://localhost:4000`, API on `http://localhost:4001`.                                |
| Staging     | Release candidate QA  | Should use `staging.stagelink.link` for the web app and a staging Railway API/database.        |
| Production  | Smoke-only validation | Use only non-mutating smoke tests and monitoring. Canonical domain is `https://stagelink.art`. |

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

Section 6 security testing is tracked in:

- `docs/security-testing-section-6.md`

Section 7 performance testing is tracked in:

- `docs/performance-testing-section-7.md`

Section 8 data/reliability testing is tracked in:

- `docs/data-reliability-section-8.md`

Section 9 UAT/final QA testing is tracked in:

- `docs/uat-final-qa-section-9.md`
