# StageLink — Unit Testing Section 2

Status: complete
Last checked: 2026-04-29

This document records the first dedicated unit-test expansion after the base QA
infrastructure work. The goal was to add meaningful backend and frontend unit
coverage without turning the suite into a wall of brittle mocks.

## Scope

### 2.1 Backend Unit Tests

Added focused Jest coverage for backend logic that had high product impact and
low test friction:

| Area               | File                                                          | Coverage Added                                                                                                                                                           |
| ------------------ | ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Username utilities | `apps/api/src/common/utils/username.util.spec.ts`             | Normalization, valid formats, invalid edge separators, invalid characters, length limits, combined normalize/validate behavior.                                          |
| CUID route pipe    | `apps/api/src/common/pipes/parse-cuid.pipe.spec.ts`           | Valid CUID passthrough, uppercase alphanumeric support, malformed ID errors.                                                                                             |
| Onboarding service | `apps/api/src/modules/onboarding/onboarding.service.spec.ts`  | Username availability, reserved/taken states, existing artist conflict, invalid username handling, Prisma unique-conflict handling, successful transaction side effects. |
| Tenant resolver    | `apps/api/src/modules/tenant/tenant-resolver.service.spec.ts` | Username resolution, invalid/missing/no-page returns, custom-domain normalization, platform-host skipping, no-page custom domain handling.                               |

Backend testing principles used:

- Mock infrastructure edges (`PrismaService`, audit, PostHog) rather than pure
  logic.
- Keep helper tests table-driven or direct where possible.
- Assert stable public behavior and important side effects, not private
  implementation details.
- Cover error paths that affect API response semantics.

### 2.2 Frontend Unit Tests

Added React Testing Library coverage for small but user-visible components and
onboarding interactions:

| Area             | File                                                                          | Coverage Added                                                                                         |
| ---------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Empty state      | `apps/web/src/components/shared/__tests__/EmptyState.test.tsx`                | Required/optional copy, optional action button, callback, custom class merge.                          |
| FAQ item         | `apps/web/src/features/help/components/__tests__/FaqItem.test.tsx`            | Collapsed initial render and click-to-toggle answer behavior.                                          |
| Login form       | `apps/web/src/features/auth/components/__tests__/LoginForm.test.tsx`          | Translated submit CTA, locale-aware signup link, accessible auth error.                                |
| Artist name step | `apps/web/src/features/onboarding/components/__tests__/StepName.test.tsx`     | Initial value, trimmed submit, whitespace validation, Enter-key submit behavior.                       |
| Username step    | `apps/web/src/features/onboarding/components/__tests__/StepUsername.test.tsx` | Availability feedback, lowercase input handling, unavailable reason copy, error fallback, back action. |

Frontend testing principles used:

- Test through accessible roles, labels, and visible text.
- Mock framework hooks only at the boundary (`next-intl`,
  `useUsernameCheck`).
- Prefer user-level interactions for click flows; use direct events only for
  exact keyboard/whitespace edge cases.
- Keep tests near the component using the existing
  `src/**/__tests__/**/*.test.{ts,tsx}` convention.

## Infrastructure Touches

The web test setup now imports the Vitest-specific jest-dom entrypoint and
cleans up the DOM after each test:

- `apps/web/vitest.setup.ts`

This prevents cross-test DOM leakage and keeps React Testing Library assertions
available through Vitest globals.

## Local Verification

Commands run on 2026-04-29:

```bash
pnpm --filter @stagelink/api exec jest --runInBand
pnpm --filter @stagelink/web test
```

Results:

```text
API: 26 test suites passed, 238 tests passed
Web: 5 test files passed, 15 tests passed
```

## Remaining Follow-Up

Recommended next tests after this section:

- API controller-level tests for request validation and HTTP status mapping.
- Frontend tests for larger dashboard/EPK flows once those components are split
  into smaller testable units.
- Integration tests with a real test database, covered by the later integration
  testing section rather than this unit-test section.
