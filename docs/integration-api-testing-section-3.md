# StageLink — Integration & API Testing Section 3

Status: implemented
Last checked: 2026-04-30

This section adds the first dedicated API integration-test layer. The suite now
contains DB-backed integration tests, HTTP API contract tests and async-flow
coverage for webhooks plus scheduled jobs.

## Scope

### 3.1 Integration Tests Between Modules

Implemented test coverage:

| Flow                      | File                                                               | What It Validates                                                                                                                                                                                                                                                                                                           |
| ------------------------- | ------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Onboarding to public page | `apps/api/src/modules/public/public-page-flow.integration-spec.ts` | `OnboardingController` + `OnboardingService` create user-owned artist records, page, membership and audit log; `TenantResolverService` resolves the public tenant; `PublicPagesController` + `PublicPagesService` return localized public data and only published blocks; page view and link click analytics are persisted. |
| Custom domain public page | `apps/api/src/modules/public/public-page-flow.integration-spec.ts` | Active custom domains resolve through the same tenant/public-page pipeline as usernames.                                                                                                                                                                                                                                    |

The suite uses:

- NestJS TestingModule
- Real `PrismaService`
- Real PostgreSQL database
- Real Prisma migrations
- Real `AuditService`, `OnboardingService`, `TenantResolverService` and
  `PublicPagesService`
- Mocked external/network edges only: PostHog, Shopify public selection and
  Smart Merch product resolution

### 3.2 Complete API Testing

Implemented test coverage:

| Flow                   | File                                                 | What It Validates                                                                                                                                      |
| ---------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| API success responses  | `apps/api/src/test/api-contract.integration-spec.ts` | Every current API route responds through the Nest HTTP layer with the expected method, path, status code, content type and basic response consistency. |
| Authentication         | `apps/api/src/test/api-contract.integration-spec.ts` | Every protected route rejects unauthenticated requests with the shared `401` error envelope; public routes remain reachable without auth.              |
| Authorization          | `apps/api/src/test/api-contract.integration-spec.ts` | Representative ownership-protected routes return `403` through the shared error envelope when access is insufficient.                                  |
| Schema/error responses | `apps/api/src/test/api-contract.integration-spec.ts` | DTO validation, malformed public IDs and service exceptions normalize through `HttpExceptionFilter`.                                                   |

The API contract suite uses:

- NestJS TestingModule
- Global API prefix (`/api`)
- Global `ValidationPipe` matching `main.ts`
- Global `HttpExceptionFilter`
- `supertest` against the in-process Nest HTTP adapter
- Mocked services and test guards, so the suite validates API wiring without
  network or database dependencies

### 3.3 Webhooks / Async Jobs Testing

Implemented test coverage:

| Flow                        | File                                                       | What It Validates                                                                                                                                |
| --------------------------- | ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Stripe webhook idempotency  | `apps/api/src/modules/billing/billing.service.spec.ts`     | Duplicate Stripe events are skipped by `stripe_event_id`; stale out-of-order events do not overwrite newer subscription state.                   |
| Stripe webhook retry safety | `apps/api/src/modules/billing/billing.service.spec.ts`     | Subscription mutation failures are propagated so Stripe can retry; invoice-backed lookup failures happen before recording an event as processed. |
| Ignored webhook events      | `apps/api/src/modules/billing/billing.service.spec.ts`     | Unsupported Stripe event types acknowledge receipt without opening a mutation transaction or writing `stripe_webhook_events`.                    |
| Scheduled insights jobs     | `apps/api/src/modules/insights/insights.scheduler.spec.ts` | Daily batches skip overlapping runs, continue after thrown failures and continue after handled per-connection failures.                          |
| Scheduled sync retry target | `apps/api/src/modules/insights/insights.service.spec.ts`   | Connected stale connections, including previously errored ones, are selected for scheduled retry processing.                                     |
| Scheduled sync persistence  | `apps/api/src/modules/insights/insights.service.spec.ts`   | Successful jobs return `true`; provider failures return `false` while persisting `lastSyncStatus='error'` and a normalized error message.        |

Current async architecture:

- Stripe billing webhooks are the only external webhook handler in production
  scope today.
- StageLink Insights uses a Nest scheduler as the current background job
  processor. It does not use Redis/BullMQ/SQS or a dedicated queue worker yet.
- Queue-processing test coverage should be added when a real queue abstraction
  is introduced. Until then, async coverage maps to webhook transactions,
  scheduler batching, idempotency, retry signaling and failure persistence.

## Commands

Run locally after starting/creating a local Postgres test database:

```bash
pnpm --filter @stagelink/api db:generate
DATABASE_URL=postgresql://stagelink:stagelink@localhost:5432/stagelink_test \
DIRECT_URL=postgresql://stagelink:stagelink@localhost:5432/stagelink_test \
pnpm --filter @stagelink/api exec prisma migrate deploy
pnpm test:api:integration
```

`pnpm test:api:integration` defaults to:

```text
postgresql://stagelink:stagelink@localhost:5432/stagelink_test
```

The test helper refuses to reset the database unless:

- `NODE_ENV=test`
- the database URL points to a local database
- the database name is `stagelink_test` or the local CI-created `postgres`
  database

To run only the API contract suite:

```bash
pnpm --filter @stagelink/api exec jest \
  --config ./jest.integration.config.ts \
  --runTestsByPath src/test/api-contract.integration-spec.ts \
  --runInBand
```

To run the async-flow unit coverage added for 3.3:

```bash
pnpm --filter @stagelink/api exec jest \
  src/modules/billing/billing.service.spec.ts \
  src/modules/insights/insights.scheduler.spec.ts \
  src/modules/insights/insights.service.spec.ts \
  --runInBand
```

## CI

`.github/workflows/ci.yml` now includes an `API integration tests` job that:

1. Starts a PostgreSQL 16 service database named `stagelink_test`.
2. Installs dependencies.
3. Builds shared types.
4. Generates Prisma Client.
5. Applies Prisma migrations.
6. Runs `pnpm test:api:integration`.
7. Publishes JUnit annotations from
   `apps/api/test-results/integration-junit.xml`.

The build job now depends on this integration job, so pull requests cannot build
green if the API integration flow fails.

## Local Verification Notes

Checked on 2026-04-30:

- `pnpm typecheck` passes.
- `pnpm --filter @stagelink/api exec jest src/modules/billing/billing.service.spec.ts src/modules/insights/insights.scheduler.spec.ts src/modules/insights/insights.service.spec.ts --runInBand`
  passes with webhook, scheduler and scheduled-sync job coverage.
- `pnpm --filter @stagelink/api exec jest --config ./jest.integration.config.ts --runTestsByPath src/test/api-contract.integration-spec.ts --runInBand`
  passes with 142 API contract tests.
- `pnpm --filter @stagelink/api exec jest --config ./jest.integration.config.ts --listTests`
  discovers both integration suites.
- A direct local execution correctly compiles the suite and fails only because
  this Codex environment has no local Postgres/Docker available for the
  DB-backed suite.

CI is the source of truth for the full DB-backed execution unless a developer
has local Postgres running.
