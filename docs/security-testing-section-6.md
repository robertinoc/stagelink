# StageLink — Security Testing Section 6

Status: implemented and locally validated
Last checked: 2026-05-01

This document records the Section 6 security testing work:

- 6.1 Seguridad básica: auth, roles/permissions, input validation
- 6.2 Vulnerabilidades: XSS, SQL Injection, CSRF
- 6.3 Rate limiting / brute force: login abuse and API rate limits

## Scope

Security testing focused on application-level controls that can be verified in
the repo and local automated tests. WorkOS-hosted login brute-force protection is
provider-owned, so the local app validates only StageLink session/API behavior
and documents the external control requirement.

## Controls Reviewed

| Area             | Current control                                                                                                                                                           | Validation                                                                                                                                            |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Auth             | Global NestJS `JwtAuthGuard` validates WorkOS JWTs and resolves users from DB. Public routes require explicit `@Public()`.                                                | API contract suite rejects unauthenticated requests for protected endpoints.                                                                          |
| Permissions      | `OwnershipGuard` resolves resource ownership through `MembershipService` and fails closed when metadata is missing.                                                       | API contract suite checks representative 403 paths for artist/page/block/billing/smart-link/subscriber routes.                                        |
| Input validation | Global `ValidationPipe` uses `whitelist`, `forbidNonWhitelisted`, and transform. DTOs and pipes validate IDs, URLs, enums and limits.                                     | Contract tests cover malformed IDs, forbidden DTO fields and malicious public payloads.                                                               |
| XSS              | React escapes user content by default; email HTML escapes visitor input; public JSON-LD injects only `JSON.stringify(jsonLd)`.                                            | Static scan for `dangerouslySetInnerHTML`, `innerHTML`, `eval`, `new Function`; no arbitrary HTML rendering found.                                    |
| SQL injection    | Prisma is used for ORM access. Existing raw SQL uses tagged `$queryRaw` interpolation, not unsafe concatenation.                                                          | Static scan for `$queryRawUnsafe`/`executeRawUnsafe`; only test DB reset uses unsafe raw SQL. Malformed public IDs now fail before service execution. |
| CSRF             | Authenticated API calls use Bearer tokens from the server-side web tier. Public POST endpoints are intentionally unauthenticated and protected by validation/rate limits. | Reviewed route model; no cookie-authenticated mutation endpoint exposed directly from the browser API without server-side session handling.           |
| Rate limits      | Public API resolver/events use `PublicRateLimitGuard`; uploads use `UploadRateLimitGuard`; web `/go/[id]` and landing contact use `checkRateLimit`.                       | Added unit tests for API guards and web limiter namespace isolation/quota enforcement.                                                                |

## Fixes Applied

1. Public SmartLink resolver now validates SmartLink IDs as CUIDs instead of
   UUIDs.
   - Previous behavior: `GET /api/public/smart-links/:id/resolve` rejected real
     Prisma CUIDs because it used `ParseUUIDPipe`.
   - Current behavior: route uses `ParseCuidPipe`.

2. Private subscriber routes now validate `artistId` as CUID instead of UUID.
   - Previous behavior: `GET /api/artists/:artistId/subscribers` and
     `/export` rejected real Prisma CUID artist IDs.
   - Current behavior: both routes use `ParseCuidPipe`.

3. Public link-click event payloads now reject malformed IDs and link item IDs
   before service execution.
   - `artistId`, `blockId`, and `smartLinkId` must match StageLink CUID format.
   - `linkItemId` is limited to letters, numbers, underscores and hyphens.
   - Oversized labels remain bounded by the existing `MaxLength(512)` rule.

4. Added security regression tests:
   - API contract probes for SQLi/XSS-style payloads against public event
     recording.
   - API contract probe for malformed public SmartLink IDs.
   - API contract probe for forbidden fields on protected DTOs.
   - API rate-limit guard tests for public and upload abuse.
   - Web rate-limit tests for quota enforcement and namespace isolation.

## Automated Test Commands

Commands run locally on 2026-05-01:

```bash
pnpm --filter @stagelink/api exec jest --config ./jest.integration.config.ts --runInBand src/test/api-contract.integration-spec.ts
pnpm --filter @stagelink/api exec jest --runTestsByPath src/common/guards/rate-limit.guard.spec.ts
pnpm --filter @stagelink/web exec vitest run src/lib/__tests__/rate-limit.test.ts
```

Results:

```text
API contract: 145 passed
API rate limit guards: 2 passed
Web rate limit: 2 passed
```

## Manual Security QA Checklist

Run these against staging before closing the security section:

| Scenario                                                       | Expected result                                                                        |
| -------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Call protected API without `Authorization` header              | `401` with shared error envelope.                                                      |
| Call a protected artist/page/block route as a non-member       | `403` or resource-safe `404`, never private data leakage.                              |
| POST public link-click with `artistId="' OR 1=1 --"`           | `400`; no analytics event persisted.                                                   |
| POST public link-click with `<script>` in `linkItemId`         | `400`; no analytics event persisted.                                                   |
| Resolve `/api/public/smart-links/not-a-cuid/resolve`           | `400`; service is not reached.                                                         |
| Resolve a real SmartLink CUID                                  | `200` with `{ url }` or expected `404` if inactive/missing.                            |
| Hit public endpoints above quota from same IP                  | `429`.                                                                                 |
| Request more than 20 upload intents in 60 seconds as same user | `429`.                                                                                 |
| Submit landing contact form too fast or with honeypot filled   | Silent `{ ok: true }`, no email sent.                                                  |
| Attempt repeated password login in WorkOS hosted UI            | WorkOS protection should rate-limit/challenge according to WorkOS production settings. |

## Known Risks / Follow-ups

| Priority | Risk                                                                                              | Recommendation                                                                                            |
| -------- | ------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| P1       | Rate limiters are in-memory and do not coordinate across Vercel/Railway instances.                | Replace with Redis/Upstash/Vercel KV before sustained high-traffic launch.                                |
| P1       | WorkOS brute-force policy is external to the repo.                                                | Confirm production WorkOS rate-limit/MFA/session settings during the security audit.                      |
| P2       | Public event endpoints remain unauthenticated by design.                                          | Keep strict validation and rate limits; consider signed event tokens if analytics abuse becomes material. |
| P2       | `X-Forwarded-For` is trusted for rate-limit identity.                                             | Ensure Railway/Vercel/Cloudflare strip or normalize untrusted forwarded headers.                          |
| P3       | CSRF is not a primary risk while protected API uses Bearer tokens via server-side route handlers. | Reassess if browser-direct cookie-authenticated mutation endpoints are introduced.                        |

## Section 6 Status

Section 6 can be considered healthy after CI passes this PR and staging manual
checks confirm WorkOS brute-force protection and real deployed rate-limit
behavior.
