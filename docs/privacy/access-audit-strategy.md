# Access Audit Strategy

Status: Privacy-by-Design baseline.
Date: 2026-05-14

## Purpose

Access auditing gives StageLink accountability for sensitive data access,
administration, DSAR handling, and privacy/security incident review.

## Current Audit Surfaces

Observed:

- `audit_logs` table for backend-sensitive actions.
- DSAR request records in `dsar_requests`.
- Behind role audit events in Upstash Redis.
- Runtime logs in Vercel/Railway.
- WorkOS security/auth events.
- Stripe webhook processing records.

## Events That Should Be Audited

### Account and authentication

- account provisioning
- account suspension/reactivation
- account deletion/anonymization
- WorkOS auth/radar events through provider logs
- failed authorization checks only when useful for abuse review

### Artist workspace

- artist create/update/delete
- membership/role changes
- public page publish/unpublish
- EPK publish/unpublish
- asset upload intent/confirm/delete
- subscriber list export/access
- provider connection/disconnection

### Privacy and DSAR

- data export requested/completed
- profile rectification
- account deletion requested/completed/failed
- consent withdrawal via privacy settings
- objection request intake
- manual provider deletion completion

### Behind the Stage

- admin user search
- admin user detail view
- user status update
- user deletion/suspension
- role grant/demotion/removal
- invitation creation
- debug header access

### Billing and webhooks

- checkout session creation
- billing portal session creation
- subscription status refresh
- Stripe webhook accepted/rejected/duplicate
- plan entitlement changes

## Audit Event Shape

Recommended minimum:

```json
{
  "actorId": "user_or_null",
  "action": "string.event.name",
  "entityType": "artist|user|asset|dsar|subscription|admin",
  "entityId": "id",
  "metadata": {
    "requestId": "optional",
    "artistId": "optional",
    "status": "optional",
    "reasonCode": "optional"
  },
  "ipAddress": "optional",
  "createdAt": "server timestamp"
}
```

Never include:

- access tokens
- refresh tokens
- provider API tokens
- cookies
- raw request bodies
- full subscriber lists
- DSAR export payloads
- free-text support/contact message bodies

## Audit Storage and Access

`audit_logs`:

- Internal only.
- Not displayed to regular artist users by default.
- May be included in DSAR export only as privacy-safe recent activity where
  useful and not harmful to security.

Behind role audit:

- Owner-only access.
- Maximum retained event count exists today; define duration/size target later.

Provider logs:

- WorkOS, Stripe, Vercel, Railway, PostHog, and Resend logs must be reviewed in
  provider consoles during incidents.

## Retention

Recommended baseline:

- DSAR records: 3 years.
- Security/admin audit logs: 1 year.
- Billing webhook idempotency records: 13 months.
- Runtime logs: 30 to 90 days depending provider plan.

Open decision:

- Final retention must be approved before launch and implemented in cleanup
  jobs.

## Incident Use

During a privacy/security incident, audit data should answer:

- who accessed the data?
- which tenant/resource was involved?
- when did it happen?
- was the action normal, admin, automated, or abusive?
- what provider systems may also contain evidence?
- what data categories were exposed or changed?

## Gaps

| Gap | Severity | Recommendation |
| --- | --- | --- |
| Admin view/search audit is incomplete | High | Add explicit Behind audit events before public launch. |
| Audit retention jobs are missing | High | Implement retention cleanup once final periods are approved. |
| Provider deletion completion is not centrally tracked | High | Add provider deletion checklist/log field to DSAR workflow. |
| Audit metadata has no schema | Medium | Add typed helper or allowed metadata schemas for sensitive modules. |

