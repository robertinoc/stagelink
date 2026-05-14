# Privacy-Safe Logging Policy

Status: Privacy-by-Design baseline.
Date: 2026-05-14

## Logging Goals

StageLink logs must support security, debugging, reliability, and compliance
without becoming a secondary personal-data store.

## Data That May Be Logged

Allowed when needed:

- request ID
- event/action name
- HTTP method
- sanitized path without query string
- status code
- actor/user ID when needed for auditability
- entity type and entity ID
- high-level feature/error code
- boolean flags and counts
- provider event ID for idempotency

## Data That Must Not Be Logged

Do not log:

- passwords or password reset values
- WorkOS authorization codes, access tokens, refresh tokens, cookies, or
  Authorization headers
- Stripe secret keys, webhook signatures, card/payment details
- Shopify/merch/OAuth provider API tokens
- raw request bodies containing profile, contact, EPK, subscriber, support, or
  free-text content
- full URLs with query strings when query params may contain tokens or personal
  data
- raw IP addresses unless a specific security need is documented
- exported DSAR payloads

## Current Controls Observed

- API HTTP exception filter sanitizes paths and message strings.
- Server errors return a generic public message.
- `security-log.ts` sanitizes log values and removes query strings from paths.
- Request ID middleware exists for correlation.
- Analytics stores IP hashes rather than raw IP in event records.
- DSAR export redacts provider tokens and secrets.
- Several modules emit audit logs for sensitive actions.

## Current Risks

| Risk | Severity | Notes |
| --- | --- | --- |
| `console.error` in Next.js proxy routes may include thrown error objects | Medium | Usually safe, but must not include request bodies, tokens, or full URLs. |
| Audit metadata is flexible JSON | Medium | Developers can accidentally include PII or secrets. |
| Provider/client runtime logs have external retention | High | Vercel/Railway retention, region, and access policy must be confirmed. |
| Contact/support messages may include sensitive data | Medium | Avoid body logging and define support inbox retention. |

## Audit Log Policy

Use `audit_logs` for:

- artist create/update/delete/publish actions
- asset upload intent/confirm/delete actions
- subscriber export/list/access
- DSAR export/update/delete requests
- Behind role changes and user-management actions
- billing changes and webhook processing decisions
- provider connection/disconnection
- security-relevant access-denied or abuse events when useful

Metadata rules:

- Include IDs and high-level context, not full payloads.
- Never include provider tokens or auth tokens.
- Avoid email unless needed; prefer user ID or hashed email for internal-only
  correlation.
- Include `requestId` where practical.
- Include `ipAddress` only when needed for security and subject to retention.

## Recommended Sanitization Standard

Before logging a value:

1. Remove query strings from paths and URLs.
2. Replace token-like values with `[redacted]`.
3. Truncate strings to a safe length.
4. Avoid logging nested request/response objects.
5. Prefer structured metadata with explicit keys over interpolated JSON dumps.

## Retention

Suggested baseline:

- Application runtime logs: 30 to 90 days.
- Security/audit logs: 1 year unless legal/security needs require longer.
- DSAR request logs: 3 years after completion for accountability.
- Provider webhook idempotency logs: 13 months unless Stripe/legal retention
  requires more.

Retention is not yet automated and remains a high-priority launch backlog item.

## Required Follow-Ups

- Confirm Vercel and Railway log retention/access settings.
- Add audit events for admin/Behind user detail views and sensitive actions.
- Add lint/review guidance: do not add `console.log` with request bodies.
- Add retention cleanup jobs for `audit_logs` if final retention is shorter
  than indefinite.

