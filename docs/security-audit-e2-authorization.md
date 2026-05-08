# StageLink — Security Audit E2.2: Authorization

Status: completed with fix
Last checked: 2026-05-07

## Scope

This audit closes:

- T2.2.1 — ownership validation for resources;
- T2.2.2 — IDOR/BOLA risk review;
- T2.2.3 — multi-tenant isolation review.

The review covered private API controllers, ownership decorators/guards,
membership resolution, service-level membership checks, public endpoints that
accept tenant/resource IDs and the current admin guard boundary.

## Authorization Model

StageLink is tenant-scoped by artist. The source of truth is
`ArtistMembership`, with role weight:

| Role   | Access level |
| ------ | ------------ |
| viewer | read         |
| editor | write        |
| admin  | admin        |
| owner  | owner        |

The primary authorization primitives are:

- `JwtAuthGuard`: global API authentication guard.
- `OwnershipGuard`: route-level guard for resources resolvable to an artist.
- `MembershipService.validateAccess()`: service-level tenant access check.
- `MembershipService.resolveArtistIdForResource()`: maps `artist`, `page`,
  `block` and `smartLink` IDs to their parent artist.
- `AdminOwnerGuard`: platform-owner guard for Behind/admin endpoints.

## T2.2.1 — Ownership Resources

Reviewed ownership coverage:

| Area                  | Ownership posture                                                                                  | Status |
| --------------------- | -------------------------------------------------------------------------------------------------- | ------ |
| Artists               | Controller uses `OwnershipGuard`; service repeats membership checks for read/write/owner.          | OK     |
| Pages                 | Controller uses `OwnershipGuard`; service resolves page → artist before update.                    | OK     |
| Blocks                | Controller uses `OwnershipGuard`; service resolves page/block → artist and validates all reorders. | OK     |
| SmartLinks            | Update/delete use `OwnershipGuard`; list/create validate artist membership in service.             | OK     |
| Assets/uploads        | Service validates artist membership for intent/list and resolves asset → artist for confirm.       | OK     |
| EPK                   | Service validates artist membership before read/write/publish/unpublish/generate-bio.              | OK     |
| Analytics private     | Controller uses `OwnershipGuard` on artist ID.                                                     | OK     |
| Subscribers private   | Controller uses `OwnershipGuard`; export is audited.                                               | OK     |
| Billing private       | Controller uses `OwnershipGuard`; checkout/portal/refresh require admin.                           | OK     |
| Insights integrations | Controller uses `OwnershipGuard`; service repeats write checks for connection mutations.           | OK     |
| Shopify / Merch       | Service validates artist membership and feature access before reading/updating provider secrets.   | OK     |
| Behind/admin          | Controller-level `AdminOwnerGuard` plus global JWT.                                                | OK     |

## T2.2.2 — IDOR / BOLA Risk

Findings and actions:

| Item                               | Status | Notes                                                                                                                                                                     |
| ---------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Direct object access by `artistId` | OK     | Private artist-scoped endpoints either use `OwnershipGuard` or call `MembershipService.validateAccess()` before returning data.                                           |
| Direct object access by `pageId`   | OK     | Page and block flows resolve `pageId` to its parent artist before checking membership.                                                                                    |
| Direct object access by `blockId`  | OK     | Block mutations resolve `blockId` to page → artist before write access; public subscriber flow requires published email-capture blocks only.                              |
| Direct object access by `assetId`  | OK     | Upload confirm resolves the asset record first, then validates write access to the asset's artist before mutating status or artist avatar/cover fields.                   |
| Public link-click analytics        | Fixed  | `recordLinkClick()` now drops events when a supplied `blockId` or `smartLinkId` does not belong to the submitted `artistId`, or when the block/link is not public-active. |
| Enumeration behavior               | OK     | Missing membership returns `404` for tenant resources in `MembershipService.validateAccess()`, reducing cross-tenant existence leaks.                                     |
| Reorder payload injection          | OK     | Block reorder requires the full page block set and updates with `{ id, pageId }`, preventing cross-page position writes.                                                  |

## T2.2.3 — Multi-Tenant Isolation

Tenant isolation is application-enforced through membership checks and
artist-scoped DB queries. No database row-level security is currently enabled.

Current launch posture:

- Private tenant data is guarded in the API by JWT + membership validation.
- Public page/EPK endpoints expose only published public fields.
- Public SmartLink resolution only resolves active links.
- Public analytics writes are fire-and-forget and now validate optional
  block/smart-link tenant ownership before persisting IDs.
- Admin/Behind functions are isolated behind a separate owner/admin guard and
  documented as platform-level, not artist-tenant scoped.

## Changes Made In This Section

- Hardened public link-click analytics against cross-tenant `blockId` /
  `smartLinkId` injection.
- Added regression coverage for accepted same-tenant events and dropped
  cross-tenant analytics events.
- Documented the ownership/resource matrix and IDOR/BOLA posture for E2.2.

## Residual Backlog

| Priority | Item                                                                                   | Target section                                             |
| -------- | -------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| Closed   | Replace hardcoded Nest `AdminOwnerGuard` owner email with env/config                   | Closed in E2.6 via `BEHIND_ADMIN_EMAILS` shared API config |
| P2       | Consider declarative `OwnershipGuard` on service-validated controllers for readability | E3 hardening                                               |
| P3       | Consider DB row-level security if StageLink evolves into heavier multi-tenant usage    | Audit 360 / future architecture                            |
