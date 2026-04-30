# StageLink — E2E Testing Section 4

Status: implemented
Last checked: 2026-04-30

This section expands Playwright coverage from basic smoke tests into critical
user journeys and StageLink business journeys.

## Scope

### 4.1 Critical E2E Flows

Implemented coverage:

| Flow                    | File                                                       | Notes                                                                                                               |
| ----------------------- | ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Signup/login entry UI   | `e2e/auth/login-signup.spec.ts`                            | Validates StageLink-owned login/signup pages and navigation to each entry point without needing WorkOS credentials. |
| Authenticated app entry | `e2e/critical/artist-onboarding-upload-navigation.spec.ts` | Uses persisted WorkOS session state when `E2E_AUTH_EMAIL` and `E2E_AUTH_PASSWORD` are configured.                   |
| Profile creation        | `e2e/critical/artist-onboarding-upload-navigation.spec.ts` | Mutating onboarding flow is guarded by `E2E_RUN_ONBOARDING=true` and should use a reset/new test account.           |
| Upload content          | `e2e/critical/artist-onboarding-upload-navigation.spec.ts` | Avatar upload flow is guarded by `E2E_RUN_UPLOAD=true` and requires staging S3/upload configuration.                |
| Navigation              | `e2e/critical/artist-onboarding-upload-navigation.spec.ts` | Covers dashboard, profile, page builder and analytics navigation for an authenticated seeded artist.                |

### 4.2 StageLink Business Flows

Implemented coverage:

| Flow                  | File                                           | Notes                                                                                        |
| --------------------- | ---------------------------------------------- | -------------------------------------------------------------------------------------------- |
| Artist profile        | `e2e/business/public-business-journey.spec.ts` | Validates a published public artist page by direct StageLink URL.                            |
| Discovery/search      | `e2e/business/public-business-journey.spec.ts` | Current product discovery is direct username/profile URL; no dedicated search UI exists yet. |
| Booking/contact       | `e2e/business/public-business-journey.spec.ts` | Validates `mailto:` booking/contact availability when the demo artist exposes contact email. |
| Notifications/fanlist | `e2e/business/public-business-journey.spec.ts` | Validates email capture subscription when the demo artist exposes an email capture block.    |

## Playwright Projects

`playwright.config.ts` now separates projects by risk and required data:

- `smoke`: production-safe public smoke tests.
- `auth-ui`: login/signup page checks that do not require external auth.
- `public`: public profile and business journeys using `E2E_DEMO_ARTIST`.
- `mobile`: mobile regression for public journeys.
- `setup` and `authenticated`: enabled only when `E2E_AUTH_EMAIL` and
  `E2E_AUTH_PASSWORD` are present.

## Environment Variables

Recommended staging variables:

```bash
PLAYWRIGHT_BASE_URL=https://staging.stagelink.link
E2E_DEMO_ARTIST=demo-artist-username
E2E_AUTH_EMAIL=artist-e2e@example.com
E2E_AUTH_PASSWORD=...
```

The staging GitHub Actions job passes the matching optional secrets through to
Playwright. If the auth credentials are absent, the authenticated project is not
registered and the run stays limited to auth UI, public, mobile and smoke
coverage.

Optional mutating journey flags:

```bash
E2E_RUN_ONBOARDING=true # only with a reset/new WorkOS test user
E2E_RUN_UPLOAD=true     # only when staging upload/S3 is configured
```

## Commands

```bash
pnpm test:e2e
pnpm test:e2e:smoke
npx playwright test --project=auth-ui
npx playwright test --project=public
E2E_AUTH_EMAIL=... E2E_AUTH_PASSWORD=... npx playwright test --project=authenticated
```

## Current Product Notes

- WorkOS Hosted Auth is an external browser journey. Full login automation is
  intentionally gated by real test credentials instead of mocked cookies.
- Public discovery/search is currently direct username URL discovery. Add a
  dedicated search-flow E2E when StageLink ships an in-app discovery/search UI.
- Booking/contact on public artist pages is currently `mailto:` based. Add form
  submission E2E when StageLink ships a first-party booking/contact form.
