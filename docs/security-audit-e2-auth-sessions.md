# StageLink — Security Audit E2.1: Auth & Sessions

Status: completed with fixes and follow-up findings
Last checked: 2026-05-07

## Scope

This audit closes:

- T2.1.1 — login/signup audit;
- T2.1.2 — sessions/tokens audit;
- T2.1.3 — password recovery audit.

Evidence was collected from the WorkOS AuthKit integration in the Next.js app,
the NestJS JWT guard, protected layouts, auth route handlers and the current
QA notes from the WorkOS Radar configuration review.

## T2.1.1 — Login / Signup

StageLink uses WorkOS hosted AuthKit for login and signup.

Relevant files:

- `apps/web/src/app/api/auth/signin/route.ts`
- `apps/web/src/app/api/auth/signup/route.ts`
- `apps/web/src/app/api/auth/callback/route.ts`
- `apps/web/src/app/[locale]/(auth)/login/page.tsx`
- `apps/web/src/app/[locale]/(auth)/signup/page.tsx`
- `apps/web/src/middleware.ts`

Findings and actions:

| Item                     | Status | Notes                                                                                                                                                                                       |
| ------------------------ | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Hosted login/signup      | OK     | Auth UI delegates to WorkOS; app does not store user passwords.                                                                                                                             |
| Callback error handling  | OK     | Callback errors redirect to localized login with `error=auth_failed` instead of exposing raw callback failures.                                                                             |
| Dedicated Behind login   | OK     | `/api/auth/behind-signin` uses a fixed `returnTo: '/behind'`, which avoids user-controlled redirects for the admin dashboard entry point.                                                   |
| Dynamic login `returnTo` | Fixed  | `/api/auth/signin?returnTo=...` now allows only same-origin relative paths before forwarding the value to WorkOS AuthKit. Absolute, protocol-relative and ambiguous values are discarded.   |
| Signup route behavior    | Note   | `/api/auth/signup` currently falls back to WorkOS signin URL. The localized signup page uses `getSignUpUrl()` directly. Keep this documented if the route remains only a compatibility URL. |
| WorkOS Radar in staging  | OK     | Staging was adjusted manually after repeated one-time code challenges: bot detection disabled, brute force enabled with challenge decision. Production remains stricter.                    |

## T2.1.2 — Sessions / Tokens

Session ownership is split by boundary:

- Next.js/AuthKit owns the browser session cookie.
- Next.js server code reads the WorkOS session through `withAuth()`.
- The web app forwards WorkOS access tokens to the NestJS API.
- NestJS validates Bearer tokens locally against the WorkOS JWKS.
- `JwtAuthGuard` resolves the internal StageLink user from the validated WorkOS
  subject and attaches the DB user to the request.

Relevant files:

- `apps/web/src/lib/auth.ts`
- `apps/web/src/app/[locale]/(app)/layout.tsx`
- `apps/api/src/common/guards/index.ts`
- `apps/api/src/modules/auth/auth.controller.ts`
- `apps/api/src/modules/auth/auth.service.ts`

Findings and actions:

| Item                                 | Status    | Notes                                                                                                                                                                     |
| ------------------------------------ | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| JWT validation                       | OK        | API validates access tokens through WorkOS JWKS and does not trust user data directly from the client payload.                                                            |
| Missing/invalid token behavior       | OK        | API rejects missing, invalid or expired Bearer tokens with `401`.                                                                                                         |
| Suspended/deleted users              | Fixed     | API guard now rejects direct API calls for suspended or soft-deleted users even if the WorkOS access token is still cryptographically valid.                              |
| First-login provisioning             | OK        | WorkOS profile is fetched server-side only when the internal user row does not exist. Existing users use the DB path.                                                     |
| WorkOS ID rotation by email          | Monitored | Email-based reconnection is useful for domain/app migration. It relies on WorkOS-authenticated profile data and should remain covered in future auth regression tests.    |
| Bearer token in client components    | Follow-up | Some dashboard block/smart-link client components receive `accessToken` props for direct API helper calls. This is functional, but broadens browser-side bearer exposure. |
| Preferred token-forwarding direction | Decision  | New authenticated browser mutations should prefer Next.js route handlers or server actions as a BFF layer so WorkOS access tokens stay server-side whenever practical.    |

Follow-up recommendation:

- Refactor the remaining block/smart-link client flows that receive
  `accessToken` into web route handlers/server actions. This is not a launch
  blocker if current XSS posture remains clean, but it is a worthwhile hardening
  task before broad public traffic.

## T2.1.3 — Password Recovery

StageLink does not implement app-owned password reset tokens, reset links or
password storage. Password and one-time-code recovery flows are provider-managed
by WorkOS hosted authentication.

Audit result:

| Item                      | Status | Notes                                                                                                         |
| ------------------------- | ------ | ------------------------------------------------------------------------------------------------------------- |
| Local password storage    | OK     | No local password hashes or reset-token tables were found in the app/API code inspected for this section.     |
| Recovery endpoint surface | OK     | No custom password reset route was found; this keeps recovery token issuance outside the StageLink codebase.  |
| Provider dependency       | Note   | Recovery UX, expiry and anti-abuse controls depend on WorkOS configuration. Re-check during launch hardening. |

## Changes Made In This Section

- Added `sanitizeAuthReturnTo()` and coverage for safe auth return paths.
- Hardened `/api/auth/signin` so unsafe `returnTo` values are ignored.
- Hardened the API JWT guard so suspended or deleted StageLink users cannot
  continue using direct API calls with otherwise valid WorkOS tokens.
- Added unit coverage for both auth redirect sanitization and inactive-user
  authentication rejection.

## Residual Backlog

| Priority | Item                                                                             | Target section                        |
| -------- | -------------------------------------------------------------------------------- | ------------------------------------- |
| P1       | Move block/smart-link bearer-token flows to BFF                                  | E3 hardening or E4 advanced hardening |
| P2       | Re-check WorkOS recovery/MFA/session settings in production before public launch | T7-8 launch readiness                 |
