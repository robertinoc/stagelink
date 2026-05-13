# StageLink - Security Audit E2.13: Admin / Behind Dashboard Security

Status: completed with fixes and launch follow-ups
Last checked: 2026-05-13

## Scope

This audit closes:

- T2.13.1 - admin roles;
- T2.13.2 - access control;
- T2.13.3 - user search exposure;
- T2.13.4 - owner/admin assignment;
- T2.13.5 - auditability.

Reviewed surfaces:

- `behind.stagelink.art` / `apps/web/src/app/behind/*`;
- web route handlers under `apps/web/src/app/api/admin/*`;
- web role helpers in `apps/web/src/lib/admin-guard.ts`,
  `behind-config.ts`, `behind-redis.ts`;
- Nest admin module under `apps/api/src/modules/admin/*`;
- shared audit logging via `AuditService`.

## Summary

| Area                   | Status               | Notes                                                                                                                                                                           |
| ---------------------- | -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Admin roles            | Closed with fix      | Owners remain immutable via `BEHIND_ADMIN_EMAILS`; Redis roles can grant `admin` or `owner`.                                                                                    |
| Access control         | Closed with fix      | Admins can access/read Behind; user mutations, invitations and role changes are owner-only at the web edge and Nest API layer.                                                  |
| User search exposure   | Closed with decision | Behind search remains client-side over the fetched user list. Acceptable for MVP because only Behind users can access it; revisit pagination/server search as user count grows. |
| Owner/admin assignment | Closed with fix      | Role updates validate and normalize email, block self-edits, block env-owner edits and append a Redis role-audit event.                                                         |
| Auditability           | Closed with fix      | API user update/suspend/delete/invite actions now write `AuditLog` entries with actor, target and IP context.                                                                   |

## T2.13.1 - Admin Roles

Role model:

| Role    | Source                                   | Capabilities                                                      |
| ------- | ---------------------------------------- | ----------------------------------------------------------------- |
| `owner` | `BEHIND_ADMIN_EMAILS` env, or Redis role | Full Behind access, user mutations, invitations, role management. |
| `admin` | Redis role                               | Read-only Behind access for current launch posture.               |
| none    | no env/Redis role                        | No Behind access.                                                 |

Owners configured in `BEHIND_ADMIN_EMAILS` are immutable from the UI. This
preserves a bootstrap recovery path even if Redis is misconfigured.

## T2.13.2 - Access Control

Controls now align across layers:

- `apps/behind/layout.tsx` gates the Behind UI through WorkOS session +
  `hasBehindAccess()`.
- `GET /api/admin/users` uses `requireAdminSession()` so owners/admins can load
  the read-only user list.
- User mutations, invitations and role updates use `requireOwnerSession()` at
  the web edge.
- Nest `/api/admin/users` uses global `JwtAuthGuard` + `AdminAccessGuard`, so
  direct read calls require a Behind owner/admin.
- Nest mutation endpoints use global `JwtAuthGuard` + `AdminOwnerGuard`, so
  direct write calls require a platform owner.

Fix applied:

- Web route handlers for PATCH/DELETE user, PATCH status and invitations now
  require owner session instead of generic admin session.
- The Behind UI hides mutate/invite actions for non-owner admins and displays
  read-only row actions.
- The Nest API now resolves the same env/Redis role model through
  `AdminRoleService`, keeping web and Railway authorization aligned.

## T2.13.3 - User Search Exposure

Current design:

- Behind fetches all non-deleted users from `GET /api/admin/users`;
- search/filtering is client-side by name, email and artist handle;
- API response intentionally excludes `workosId`, tokens, deleted users and
  sensitive provider data.

Decision:

- Accept for MVP/admin-only usage.
- Add server-side pagination/search before broad public launch or when user
  volume makes full-list loading unnecessary exposure.

## T2.13.4 - Owner / Admin Assignment

Fix applied:

- `setRole()` normalizes and validates email addresses before writing Redis.
- Role changes still reject env-owner edits and self-role edits.
- Role changes append a capped Redis audit stream at `behind:role_audit`
  containing actor email, target email, role and timestamp.

Operational notes:

- `BEHIND_ADMIN_EMAILS` should contain at least one owner account in every
  deployed environment.
- Redis unavailable means env owners keep owner access, but Redis roles are not
  readable/writable.

## T2.13.5 - Auditability

Fix applied:

- `AdminService` now emits audit logs for:
  - `admin.user.update`;
  - `admin.user.suspend`;
  - `admin.user.unsuspend`;
  - `admin.user.soft_delete`;
  - `admin.invitation.send`.
- Audit entries include actor id, target entity, target email metadata and
  request IP when available.
- Behind role changes are audited in Redis because they live in the web/Redis
  boundary rather than the Nest/Postgres boundary.

## Files Changed

- `apps/api/src/modules/admin/admin.controller.ts`
- `apps/api/src/modules/admin/admin-owner.guard.ts`
- `apps/api/src/modules/admin/admin-owner.guard.spec.ts`
- `apps/api/src/modules/admin/admin-role.service.ts`
- `apps/api/src/modules/admin/admin-role.service.spec.ts`
- `apps/api/src/modules/admin/admin.module.ts`
- `apps/api/src/modules/admin/admin.service.ts`
- `apps/api/src/modules/admin/admin.service.spec.ts`
- `apps/api/.env.example`
- `apps/api/package.json`
- `apps/web/src/app/api/admin/invitations/route.ts`
- `apps/web/src/app/api/admin/users/[userId]/route.ts`
- `apps/web/src/app/api/admin/users/[userId]/status/route.ts`
- `apps/web/src/app/behind/UsersTable.tsx`
- `apps/web/src/lib/behind-redis.ts`
- `docs/security-audit-e2-admin-behind-security.md`
- `CLAUDE.md`

## Residual Backlog

| Priority | Item                                                                                                             | Target                |
| -------- | ---------------------------------------------------------------------------------------------------------------- | --------------------- |
| P1       | Decide whether `admin` should stay read-only or gain limited non-destructive actions after product-owner review. | T7-8 / Behind roadmap |
| P1       | Add MFA requirement for owner/admin accounts before public launch or external operators.                         | WorkOS / Launch       |
| P2       | Add server-side pagination/search for Behind users as the account base grows.                                    | Behind V2             |
| P2       | Expose/search role audit events from `behind:role_audit` in a future owner-only diagnostics view.                | Behind V2             |

## Validation

Executed validation:

```bash
pnpm install
pnpm --filter @stagelink/api db:generate
pnpm --filter @stagelink/types build
pnpm --filter @stagelink/api exec jest src/modules/admin/admin.service.spec.ts src/modules/admin/admin.config.spec.ts src/modules/admin/admin-role.service.spec.ts src/modules/admin/admin-owner.guard.spec.ts --runInBand
pnpm --filter @stagelink/api typecheck
pnpm --filter @stagelink/web typecheck
pnpm --filter "./packages/*" build
pnpm --filter @stagelink/api exec jest --runInBand
pnpm security:audit
```

Results:

- API admin targeted tests: 15 passed.
- Full API Jest suite: 37 suites / 299 tests passed.
- API and web typechecks passed after local workspace install and generated
  types.
- Security audit found no known vulnerabilities.
