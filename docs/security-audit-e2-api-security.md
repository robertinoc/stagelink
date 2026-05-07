# StageLink — Security Audit E2.3: API Security

Status: completed with fixes
Last checked: 2026-05-07

## Scope

This audit closes:

- T2.3.1 — input validation;
- T2.3.2 — XSS / injection audit;
- T2.3.3 — rate limiting analysis.

Reviewed areas:

- global NestJS `ValidationPipe`;
- DTOs for artists, blocks, EPK, billing, subscribers, smart links, uploads,
  commerce and insights;
- public endpoints and unauthenticated event ingestion;
- raw SQL usage;
- public rendering surfaces that consume API content;
- API and web-tier rate-limit guards.

## T2.3.1 — Input Validation

Global API validation is enabled with:

- `whitelist: true`;
- `forbidNonWhitelisted: true`;
- `transform: true`;
- implicit conversion.

Findings and actions:

| Item                   | Status | Notes                                                                                                                                                     |
| ---------------------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Global validation pipe | OK     | Unknown top-level DTO properties are rejected globally.                                                                                                   |
| Block configs          | OK     | Block config JSON is type-specific, max-length checked and enriched server-side. Embed URLs are derived by the backend, not trusted from the client.      |
| SmartLink URLs         | OK     | SmartLink destinations require `http`/`https` URLs and max length.                                                                                        |
| Artist/EPK URLs        | Fixed  | Artist and EPK URL DTOs now explicitly allow only `http`/`https`, closing broader protocol acceptance from generic `IsUrl()`.                             |
| Localized content      | Fixed  | Translation maps now drop unsupported fields and truncate per field length. Block localized item labels also cap accepted item IDs and number of entries. |
| Billing return URLs    | OK     | DTO validates URL shape and service enforces return URL origin against configured frontend/CORS origins.                                                  |
| Upload inputs          | OK     | Upload intent validates asset kind, MIME type, max size and generates object keys server-side.                                                            |

## T2.3.2 — XSS / Injection Audit

Findings and actions:

| Item                    | Status | Notes                                                                                                               |
| ----------------------- | ------ | ------------------------------------------------------------------------------------------------------------------- |
| SQL injection           | OK     | Raw SQL usage is parameterized through Prisma template APIs; no string-concatenated SQL was found in audited paths. |
| Public links            | OK     | Link block and SmartLink URLs are restricted to `http`/`https`; SmartLink public resolution requires active links.  |
| Embed injection         | OK     | Music/video embed URLs are parsed against provider allowlists and embed URLs are derived server-side.               |
| JSON-LD rendering       | OK     | JSON-LD uses `JSON.stringify()` before `dangerouslySetInnerHTML`; React handles normal text escaping elsewhere.     |
| Localized text payloads | Fixed  | Localized strings now have server-side caps, reducing oversized payload risk in public JSON/SSR surfaces.           |
| Protocol confusion      | Fixed  | Artist and EPK externally rendered URLs now reject non-HTTP(S) protocols at DTO validation.                         |

## T2.3.3 — Rate Limiting Analysis

Current posture:

| Surface                          | Protection                               | Status        |
| -------------------------------- | ---------------------------------------- | ------------- |
| Web `/go/:id` SmartLink redirect | In-memory fixed window, 30/min/IP        | OK for launch |
| API public SmartLink resolve     | `PublicRateLimitGuard`, 120/min/IP       | OK for launch |
| API public subscriber capture    | `PublicRateLimitGuard`, 120/min/IP       | OK for launch |
| API public link-click event      | `PublicRateLimitGuard`, 120/min/IP       | OK for launch |
| Upload intent                    | `UploadRateLimitGuard`, 20/min/user      | OK for launch |
| WorkOS login abuse               | WorkOS Radar / brute-force protection    | External      |
| General authenticated APIs       | No global per-user API limiter           | Backlog       |
| Public page/EPK reads            | No app-level limiter; cache/CDN expected | Backlog       |

Decision:

- In-memory limits remain acceptable for private QA and low-traffic launch.
- Before sustained public traffic, move abuse-sensitive limits to a shared
  store such as Redis/Upstash/Vercel KV and consider a general authenticated
  API per-user limit.

## Changes Made In This Section

- Added field allowlists and per-field length caps to localized translation
  sanitization.
- Applied translation hardening to artist, EPK and block localized content.
- Restricted artist and EPK URL DTOs to `http`/`https`.
- Added unit coverage for translation sanitization behavior.

## Residual Backlog

| Priority | Item                                                                                             | Target section            |
| -------- | ------------------------------------------------------------------------------------------------ | ------------------------- |
| P1       | Move public/authenticated rate limits to Redis/Upstash/KV before sustained public traffic        | E4.1 Rate limiting / T7-8 |
| P2       | Add app-level rate limiting for public page/EPK read endpoints if CDN protection is insufficient | E4.4 Anti-abuse           |
| P2       | Add a general authenticated API per-user limiter for expensive write paths                       | E4.1 Rate limiting        |
