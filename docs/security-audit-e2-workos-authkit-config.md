# StageLink - Security Audit E2.12: WorkOS / Radar / AuthKit Config

Status: completed with fixes and launch follow-ups
Last checked: 2026-05-13

## Scope

This audit closes:

- T2.12.1 - redirects/callbacks;
- T2.12.2 - allowed origins;
- T2.12.3 - Radar behavior;
- T2.12.4 - MFA posture;
- T2.12.5 - session lifetime;
- T2.12.6 - email/password/magic/google settings.

Evidence was collected from the WorkOS/AuthKit route handlers, Next.js
middleware, backend JWT guard, environment examples and the previously recorded
manual WorkOS checks from Final QA.

## Summary

| Area                | Status                | Notes                                                                                                                                  |
| ------------------- | --------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Redirects/callbacks | Closed with fix       | App routes use hosted AuthKit and safe server-owned return targets. Behind redirect fallback no longer throws on malformed env config. |
| Allowed origins     | Closed with checklist | Canonical production origin is `https://stagelink.art`; staging must use its own origin and matching callback.                         |
| Radar               | Closed with decision  | Production keeps bot detection and brute force protection enabled. Staging may relax bot challenges for E2E only.                      |
| MFA                 | Closed with decision  | Global MFA is not required for current MVP/private QA; revisit admin/operator MFA before broad public launch.                          |
| Session lifetime    | Closed with fix       | API now validates WorkOS JWT issuer and minimum session claims before resolving users.                                                 |
| Auth methods        | Closed with fix       | Direct `/api/auth/signup` now uses WorkOS sign-up URL instead of sign-in fallback.                                                     |

## T2.12.1 - Redirects / Callbacks

Expected WorkOS redirect URLs:

| Environment | Required callback                                                                |
| ----------- | -------------------------------------------------------------------------------- |
| Production  | `https://stagelink.art/api/auth/callback`                                        |
| Staging     | `https://staging.stagelink.link/api/auth/callback` when staging domain is active |
| Local dev   | `http://localhost:4000/api/auth/callback`                                        |

Notes:

- `stagelink.link` and `www.*` domains are canonical redirects to
  `stagelink.art`, not primary auth callback targets.
- Preview deployments should not be broad public auth targets unless explicitly
  needed for QA; if used, they need matching WorkOS callback entries.
- `WORKOS_REDIRECT_URI` must match the browser origin that starts the AuthKit
  flow because PKCE/state cookies are host-bound.

Fix applied:

- `apps/web/src/app/behind/layout.tsx` now derives the main auth origin from
  `WORKOS_REDIRECT_URI` or `NEXT_PUBLIC_APP_URL` using safe URL parsing and
  falls back to `https://stagelink.art`. A malformed env var no longer renders a
  server stack trace during Behind auth redirect.

## T2.12.2 - Allowed Origins

WorkOS dashboard and deployment config should stay aligned:

| Setting            | Production value                          |
| ------------------ | ----------------------------------------- |
| Primary app origin | `https://stagelink.art`                   |
| Auth callback      | `https://stagelink.art/api/auth/callback` |
| Behind host        | `https://behind.stagelink.art`            |
| Sign-out return    | `/` or canonical `https://stagelink.art/` |

Launch checklist:

- Vercel production `WORKOS_REDIRECT_URI=https://stagelink.art/api/auth/callback`.
- WorkOS Production has the same redirect URL set as default.
- WorkOS Staging uses staging callback when running staging E2E.
- Do not expose `WORKOS_API_KEY` or `WORKOS_COOKIE_PASSWORD` as public
  `NEXT_PUBLIC_*` variables.

## T2.12.3 - Radar Behavior

Current operating decision:

- Production: bot detection enabled; brute force protection enabled.
- Staging: brute force protection enabled; bot detection can be relaxed when it
  repeatedly challenges automated E2E test users.

Important note:

- WorkOS one-time code challenge emails are expected when Radar challenges a
  login. They are not StageLink password reset codes.
- If challenge emails happen repeatedly during QA, inspect WorkOS Radar
  detections for the test user and either complete the challenge in the browser
  or relax staging bot detection only.

## T2.12.4 - MFA Posture

Decision:

- Global MFA is deferred for the current MVP/private QA launch phase.
- MFA should be revisited for admin/operator/Behind access before broad public
  launch or before inviting external operators.

Reasoning:

- Mandatory global MFA can break authenticated E2E automation unless the E2E
  strategy is updated.
- Behind access already has an app-level allowlist/role gate, but MFA would add
  useful protection for privileged users.

## T2.12.5 - Session Lifetime / JWT Validation

Backend token validation now requires:

- a valid WorkOS JWKS signature for the configured `WORKOS_CLIENT_ID`;
- issuer in the configured/default WorkOS issuer allowlist;
- `sub` claim that identifies a WorkOS user (`user_*`);
- `sid` claim that identifies a WorkOS session (`session_*`).

New optional env var:

```bash
WORKOS_JWT_ISSUER=
```

Leave it empty for the default WorkOS issuer. Set it only if WorkOS is
configured with a custom auth domain that changes the JWT issuer.

## T2.12.6 - Auth Methods

StageLink does not handle credentials directly. WorkOS owns:

- Google;
- Email + Password;
- Magic Auth / one-time code;
- password recovery and challenge UX.

Fix applied:

- Direct `GET /api/auth/signup` now uses `getSignUpUrl()` so compatibility links
  express create-account intent consistently with the localized signup page.

## Files Changed

- `apps/api/src/common/guards/index.ts`
- `apps/api/src/common/guards/jwt-auth-token-validation.spec.ts`
- `apps/api/src/config/configuration.ts`
- `apps/api/src/config/validation.ts`
- `apps/api/.env.example`
- `.github/workflows/ci.yml`
- `apps/web/src/app/api/auth/signup/route.ts`
- `apps/web/src/app/behind/layout.tsx`
- `docs/auth-workos.md`
- `docs/security-audit-e2-auth-sessions.md`
- `CLAUDE.md`

## Residual Backlog

| Priority | Item                                                                                                       | Target            |
| -------- | ---------------------------------------------------------------------------------------------------------- | ----------------- |
| P1       | Decide admin/operator MFA policy for Behind before public launch.                                          | T7-8 / Launch     |
| P1       | Keep staging bot-detection policy documented whenever E2E challenges start recurring.                      | QA Ops            |
| P2       | If a custom WorkOS auth domain is enabled, set `WORKOS_JWT_ISSUER` in API envs and rerun auth smoke tests. | Infra             |
| P2       | Periodically re-check WorkOS redirect URLs after domain or preview URL changes.                            | Release checklist |

## Validation

Executed validation:

```bash
pnpm --filter "./packages/*" build
pnpm --filter @stagelink/api db:generate
pnpm --filter @stagelink/api exec jest src/common/guards/jwt-auth-token-validation.spec.ts --runInBand
pnpm --filter @stagelink/api typecheck
pnpm --filter @stagelink/web typecheck
pnpm --filter @stagelink/api exec jest --runInBand
pnpm security:audit
```

Result:

- API focused JWT tests: 4 passed.
- API typecheck: passed.
- Web typecheck: passed.
- API unit suite: 34 suites / 286 tests passed.
- Dependency audit: no known vulnerabilities found.
