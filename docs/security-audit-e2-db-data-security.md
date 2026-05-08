# StageLink — Security Audit E2.5: DB & Data Security

Status: completed with fixes
Last checked: 2026-05-07

## Scope

This audit closes:

- T2.5.1 — access policies / roles;
- T2.5.2 — data exposure between users;
- T2.5.3 — sensitive data handling.

Reviewed areas:

- Prisma schema and tenant relationships;
- `ArtistMembership` authorization model;
- `OwnershipGuard` and `MembershipService`;
- private artist, page, block, subscriber, asset, billing, commerce and insights
  services;
- public page and EPK data selectors;
- secret/token storage for Shopify, Smart Merch and StageLink Insights;
- upload pipeline DB records and response DTOs.

## T2.5.1 — Access Policies / Roles

StageLink uses app-layer row access through `ArtistMembership`.

| Area                         | Status | Notes                                                                                        |
| ---------------------------- | ------ | -------------------------------------------------------------------------------------------- |
| Membership source of truth   | OK     | `ArtistMembership` maps `artistId + userId + role` with unique `[artistId, userId]`.         |
| Role hierarchy               | OK     | `viewer < editor < admin < owner` is enforced by `MembershipService.validateAccess()`.       |
| Resource ownership guard     | OK     | `OwnershipGuard` resolves `artist`, `page`, `block` and `smartLink` resources to `artistId`. |
| Missing membership behavior  | OK     | Missing membership returns 404 for artist access to reduce resource enumeration.             |
| Artist CRUD                  | OK     | List is scoped to memberships; read/write/delete require read/write/owner.                   |
| Pages, blocks and smartLinks | OK     | Mutations validate parent artist ownership before DB writes.                                 |
| Subscribers                  | OK     | Private list/export routes use `OwnershipGuard` read access and audit logs.                  |
| Assets                       | OK     | Upload intent, confirm and list validate membership before DB access.                        |
| Billing                      | OK     | Billing summary/products require read; checkout/portal/refresh require admin.                |
| Commerce integrations        | OK     | Shopify and Smart Merch validate read/write membership before connection access.             |
| Insights                     | OK     | Dashboard/sync health require read; connection validation/update/sync require write.         |

Decision:

- App-layer access policy is acceptable for launch.
- PostgreSQL RLS is not currently enabled; keep it as future hardening if
  StageLink grows into heavier multi-tenant/admin workflows.

## T2.5.2 — Data Exposure Between Users

Findings and decisions:

| Surface                    | Status | Notes                                                                                                   |
| -------------------------- | ------ | ------------------------------------------------------------------------------------------------------- |
| Private artist data        | OK     | `GET /api/artists` returns only artists where caller has membership.                                    |
| Cross-tenant resource IDs  | OK     | Page/block/smartLink mutations resolve parent artist before writes.                                     |
| Subscriber PII             | OK     | Subscriber email list/export is scoped by artist and audit-logged. Internal `ipHash` is not exported.   |
| Public page selectors      | OK     | Public page returns intended public profile fields and published blocks only.                           |
| Public EPK selectors       | OK     | Public EPK requires EPK entitlement and `isPublished=true` before returning booking/contact fields.     |
| Admin user list            | OK     | Behind-only owner guard; selects user profile summary and excludes `workosId`.                          |
| Upload storage metadata    | Fixed  | Upload intent no longer exposes internal `objectKey` to browser clients. DB still stores it internally. |
| Sensitive connection flags | OK     | Shopify/Merch/Insights responses expose boolean `has*Token` flags, not raw token values.                |

## T2.5.3 — Sensitive Data Handling

Current posture:

| Data type                 | Storage / response behavior                                                                                    | Status |
| ------------------------- | -------------------------------------------------------------------------------------------------------------- | ------ |
| WorkOS identity           | `workosId` stored in `User`, not selected in admin/user DTOs.                                                  | OK     |
| Shopify Storefront token  | Encrypted with `encryptSecret()` at rest; legacy plaintext still readable for migration compatibility.         | OK     |
| Smart Merch API token     | Encrypted with `encryptSecret()` at rest; legacy plaintext still readable for migration compatibility.         | OK     |
| StageLink Insights tokens | Schema has token columns for future OAuth, but current reference-based flows store `null`.                     | OK now |
| Subscriber email          | Stored as PII for artist export; scoped by artist; export omits internal IP hash and consent text.             | OK     |
| IP addresses / analytics  | Public analytics stores hashed IP, not raw IP.                                                                 | OK     |
| Asset object keys         | Stored in DB for delivery/confirmation, no longer returned from upload-intent response.                        | Fixed  |
| Audit metadata            | Logs operational metadata only; avoid secrets/tokens in metadata.                                              | Watch  |
| DB backups                | Railway automated backups remain deferred while project is on Hobby plan; documented for T7-8 / public launch. | Known  |

## Fix Applied

### DS-001 — Remove storage object key from upload-intent response

Risk:

- `objectKey` is internal storage metadata.
- The browser only needs `assetId`, `uploadUrl` and `expiresAt`.
- Exposing the key was unnecessary data disclosure.

Changes:

- Removed `objectKey` from `UploadIntentResponseDto`.
- Removed `objectKey` from shared `UploadIntentResponse`.
- Removed `objectKey` from `AssetsService.createUploadIntent()` response.
- Updated API contract fixture.
- Added `apps/api/src/modules/assets/assets.service.spec.ts` to assert upload intent responses do not expose object keys.

Result:

- Object keys remain stored server-side for confirmation/delivery.
- Browser clients still upload with the presigned URL and confirm by `assetId`.

## Backlog / Follow-up

- E2.6 Secrets & Config: verify `.env`, CI secrets and provider tokens are never present in committed files or logs.
- Privacy Plan: classify subscriber email/contact fields as PII and define retention/export/delete workflows.
- Advanced hardening: consider PostgreSQL RLS when multi-user/team features grow.
- Future OAuth insights: if access/refresh tokens become non-null, encrypt them using the same secret encryption utility before persistence.

## Decision

E2.5 is closed with one data-minimization fix. No blocker remains for E2.6 Secrets & Config.
