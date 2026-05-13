# DSAR Identity Verification

StageLink DSAR requests are self-service and authenticated.

## Current Controls

- All DSAR endpoints require a valid WorkOS AuthKit session.
- NestJS validates the WorkOS access token through the global `JwtAuthGuard`.
- Requests resolve to the internal `users.id`; callers cannot submit arbitrary
  user IDs.
- Deletion requires typing the authenticated email address.
- API requests are rate-limited by authenticated user and IP address.

## Why Password Re-Confirmation Is Not Required Yet

StageLink supports Google, magic-link, and email/password authentication through
WorkOS. A local password prompt would be inconsistent and unavailable for OAuth
or passwordless users. The current launch-safe control is active session plus
email confirmation.

## Residual Risk

If an attacker fully controls an active browser session, they could request an
export or deletion. This is the main remaining risk.

## Future Controls

- WorkOS step-up authentication for destructive privacy actions.
- Email confirmation link for deletion.
- Cooldown/grace period before final erasure.
- Admin notification for unusual DSAR activity.
