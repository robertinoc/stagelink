# StageLink — Integration & API Testing Section 3

Status: implemented
Last checked: 2026-04-30

This section adds the first dedicated API integration-test layer. The suite now
contains both DB-backed integration tests and HTTP API contract tests.

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
- `pnpm --filter @stagelink/api exec jest --config ./jest.integration.config.ts --runTestsByPath src/test/api-contract.integration-spec.ts --runInBand`
  passes with 142 API contract tests.
- `pnpm --filter @stagelink/api exec jest --config ./jest.integration.config.ts --listTests`
  discovers both integration suites.
- A direct local execution correctly compiles the suite and fails only because
  this Codex environment has no local Postgres/Docker available for the
  DB-backed suite.

CI is the source of truth for the full DB-backed execution unless a developer
has local Postgres running.
