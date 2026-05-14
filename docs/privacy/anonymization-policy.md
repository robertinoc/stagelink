# Anonymization and Pseudonymization Policy

Status: Privacy-by-Design and Data Retention baseline.
Date: 2026-05-14

## Definitions

Pseudonymization:

- Replaces directly identifying data with stable internal IDs or hashes.
- Re-identification is still possible with additional data.
- GDPR still treats it as personal data.

Anonymization:

- Irreversibly removes the ability to identify a person.
- Must account for indirect identifiers and retained context.

StageLink should be conservative: most retained operational records are
pseudonymized, not truly anonymous.

## Current Pseudonymization Controls

- `analytics_events.ip_hash` stores SHA-256 IP hashes rather than raw IP.
- Local user IDs and artist IDs are used in audit logs instead of full account
  profiles.
- DSAR deletion anonymizes local user fields and sets `workosId` to a deleted
  marker.
- Deleted user relation in `audit_logs` can be set null through relational
  behavior.
- Provider tokens are redacted in exports.

## Data That Can Be Anonymized

| Data | Strategy |
| --- | --- |
| Deleted local user profile | Replace email/name/avatar with non-identifying deleted placeholders. |
| Historical analytics | Aggregate by day/artist/event type; drop or rotate IP hashes after retention window. |
| QA/internal analytics | Delete rather than anonymize where possible. |
| Failed/pending uploads | Delete DB row and object if not confirmed. |
| Abandoned accounts with no paid/subscriber/legal obligations | Anonymize user row and delete private workspaces. |
| Contact/support messages after support retention | Delete message bodies; retain only aggregate ticket counts if needed. |

## Data That Should Usually Be Retained or Pseudonymized

| Data | Reason |
| --- | --- |
| Stripe billing IDs and subscription event records | Legal, tax, fraud, and billing dispute needs. |
| Stripe webhook event IDs | Idempotency and replay safety. |
| Audit logs for sensitive actions | Security accountability. |
| DSAR request records | Compliance accountability. |
| Public content published by a shared artist workspace | May belong to a tenant with remaining owners. |

## Deleted Account Strategy

Current local behavior:

- User account is anonymized.
- Sole-owner artist workspaces are deleted.
- Shared workspace membership is removed if another owner exists.
- Privacy/audit records retain minimal accountability data.

Required disclosures:

- Public content may remain if it belongs to a shared workspace.
- Billing/payment records may remain in Stripe and local metadata where legally
  required.
- Provider-side deletion may require a manual runbook.
- External caches/search engines/social previews may outlive StageLink deletion.

## Analytics Anonymization

Recommended flow:

1. Keep raw event rows only for the active analytics window.
2. After the raw window, aggregate to daily metrics.
3. Drop or rotate `ip_hash`.
4. Delete QA/internal events early.
5. Preserve only non-identifying aggregate counts needed for dashboards.

Open decision:

- Final raw analytics retention period must be chosen before public launch.

Retention baseline:

- Raw first-party analytics: 13 months.
- QA/internal/non-production/bot analytics: 90 days.
- Long-term analytics: aggregate-only where possible.
- PostHog: configure provider retention to 12-13 months unless legal/product
  review chooses a shorter window.

Implementation posture:

- The current retention candidate report identifies rows that would be eligible
  for future cleanup.
- Destructive analytics cleanup is intentionally disabled until staging dry-run
  evidence and final retention approval exist.

## Downgrade Anonymization

Downgrade from PRO+/PRO should not immediately delete user-created content.

Use this sequence:

1. Lock or make premium data read-only when entitlement ends.
2. Preserve data for a 90-day grace period.
3. Notify the user before cleanup.
4. Export must remain available during the grace period.
5. After grace, delete or aggregate premium-only raw records that exceed the new
   plan's retention window.

Do not anonymize billing records that must be retained for payment, tax,
dispute, or fraud reasons.

## Inactive Account Anonymization

Automatic inactive-account anonymization is not enabled.

Before enabling it, StageLink needs:

- a reliable local `lastActiveAt` or equivalent activity signal;
- notice and recovery windows;
- exclusion rules for paid, suspended, shared-owner, DSAR, billing, and legal
  hold cases;
- provider deletion runbook;
- backup/restore implications documented.

## Re-Identification Risks

High-risk combinations:

- hashed IP + timestamp + user agent/device + rare country
- EPK location/availability + booking email
- subscriber email + source page path + artist ID
- provider external account ID + platform profile URL
- admin audit events + target email

Controls:

- Avoid collecting exact user-agent strings.
- Do not expose analytics row-level data to artists unless needed.
- Prefer aggregate dashboards.
- Avoid exporting internal correlation metadata to users unless required.

## Future Improvements

- Scheduled anonymization job for old analytics.
- Provider-side deletion/revocation tracking table.
- Data retention dashboard for Behind.
- Token rotation and stale provider connection cleanup.
- Aggregate-only long-term analytics tables.
- Legal hold support if disputes or formal law-enforcement requests appear.
- Object-storage deletion verification and orphan cleanup reporting.
