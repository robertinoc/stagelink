# RBAC and Least Privilege Architecture

Status: Privacy-by-Design baseline.
Date: 2026-05-14

## Role Systems

StageLink currently has two role planes:

1. Artist workspace roles in PostgreSQL via `ArtistMembership`.
2. Behind the Stage admin roles in environment variables and Upstash Redis.

They should remain separate.

## Artist Workspace RBAC

Source of truth:

- `artist_memberships`

Roles:

| Role | Privacy posture |
| --- | --- |
| `viewer` | Can read workspace data; should not access secrets or destructive actions. |
| `editor` | Can update content and public presentation data. |
| `admin` | Can manage higher-impact workspace settings. |
| `owner` | Can perform ownership/destructive/role-sensitive actions. |

Access levels:

- `read`
- `write`
- `admin`
- `owner`

Implementation:

- `MembershipService.validateAccess()` maps roles to access levels.
- Missing membership returns `404` for enumeration resistance.

Privacy rule:

- New endpoints must use the narrowest practical access level.

## Behind the Stage RBAC

Source of truth:

- Bootstrap owners: `BEHIND_OWNER_EMAILS` / existing owner config.
- Redis roles: `behind:roles`.
- Audit list: `behind:role_audit`.

Roles:

| Role | Intended access |
| --- | --- |
| `owner` | Manage Behind roles and sensitive admin operations. |
| `admin` | Use admin dashboard/user search where permitted, but not manage owners. |

Observed controls:

- `requireAdminSession()` requires owner or admin.
- `requireOwnerSession()` requires owner.
- Env-var owners cannot be modified from the UI.
- Users cannot change their own role.

Privacy risk:

- Admin user search can expose broad account data.
- Owner/admin role changes need strong auditability.

Required improvements:

- Log admin user search, detail view, status change, deletion, invitation, and
  role changes.
- Define retention and access to `behind:role_audit`.
- Avoid exposing unnecessary user fields in admin tables.

## Least Privilege Rules

Default:

- No access unless explicitly granted.
- Use member role for artist-scoped data.
- Use Behind role only for internal admin data.
- Use service secrets only server-side.

Do not:

- Grant admin permissions to frontend components.
- Expose backend access tokens to browser code beyond server route handler use.
- Reuse artist roles for global/admin access.
- Allow admins to self-promote or self-delete role controls.

## Sensitive Operations

Require owner-level or step-up review:

- account deletion
- workspace deletion
- role changes
- public page/EPK publication if it contains sensitive contact/rider data
- provider token connection/disconnection
- billing plan/account changes
- admin user status changes
- export of subscriber/fan lists

## Testing Requirements

Every role-sensitive feature should test:

- unauthenticated request
- authenticated user with no membership
- viewer attempting write
- editor attempting admin/owner action
- admin attempting owner action
- owner success
- cross-tenant resource ID

## Open Launch Gaps

- Some admin actions need fuller audit events.
- Step-up authentication for destructive DSAR/account deletion is not yet
  implemented.
- A written owner/admin access review cadence is missing.
- No database RLS layer is currently documented as active.

