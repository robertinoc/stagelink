# StageLink — Integration & API Testing Section 3

Status: implemented
Last checked: 2026-04-30

This section adds the first dedicated API integration-test layer. These tests
exercise real module interactions and real PostgreSQL persistence instead of
mocking the database.

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
- `pnpm --filter @stagelink/api exec jest --config ./jest.integration.config.ts --listTests`
  discovers the integration suite.
- A direct local execution correctly compiles the suite and fails only because
  this Codex environment has no local Postgres/Docker available.

CI is the source of truth for the full DB-backed execution unless a developer
has local Postgres running.
