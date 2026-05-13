# StageLink DSAR Architecture

StageLink supports authenticated Data Subject Access Rights (DSAR) flows for
account holders. The implementation is GDPR-first and also maps to practical
CCPA/CPRA consumer-rights expectations.

## Supported Rights

| Right                | StageLink implementation                                                                   | Notes                                                |
| -------------------- | ------------------------------------------------------------------------------------------ | ---------------------------------------------------- |
| Access               | `GET /api/privacy/export` returns structured JSON.                                         | Authenticated only, rate-limited.                    |
| Rectification        | `PATCH /api/privacy/me` updates account first/last name.                                   | Artist profile correction remains in Profile editor. |
| Erasure              | `DELETE /api/privacy/account` anonymizes account and deletes sole-owner artist workspaces. | Requires email confirmation.                         |
| Portability          | Same JSON export is machine-readable and portable.                                         | ZIP/encrypted links are future work.                 |
| Withdraw consent     | Cookie preferences UI controls analytics/marketing consent.                                | Server export documents client-side consent storage. |
| Object to processing | Operationally handled through support for now.                                             | Build admin workflow later if volume grows.          |

## Request Flow

1. User signs in with WorkOS/AuthKit.
2. Web route handler forwards the request to NestJS with the WorkOS access token.
3. Global `JwtAuthGuard` resolves the internal `User`.
4. `PrivacyRateLimitGuard` applies per-user/IP abuse limits.
5. `PrivacyService` creates a `dsar_requests` row with status `verified`.
6. The action is executed immediately for low-risk self-service requests.
7. Completion is recorded in `dsar_requests` and `audit_logs`.

## Identity Verification

- Export/update/delete require an active authenticated session.
- Deletion also requires typing the authenticated email address.
- The current implementation does not ask for password re-auth because WorkOS owns
  credentials and some users authenticate via Google or magic-link flows.
- Future hardening can use WorkOS step-up authentication when available.

## Auditability

Two records are created:

- `dsar_requests`: privacy lifecycle record with request type/status/metadata.
- `audit_logs`: security audit trail for export, rectification, and erasure.

Logs intentionally avoid storing export payloads or sensitive tokens.

## Tenant Isolation

Export and deletion are scoped from the authenticated `user.id` and existing
`ArtistMembership` rows. A user can only export artists where they are a member.
Deletion only deletes artist workspaces where the user is the sole owner; shared
artists remove the user's membership instead.

## Current Limitations

- No encrypted temporary download URL yet.
- No admin DSAR dashboard yet.
- No WorkOS user deletion API call yet.
- No automated third-party deletion requests to Stripe/WorkOS/PostHog yet.
