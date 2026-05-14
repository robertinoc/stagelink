# Response Playbooks

Status: Privacy Plan - incident and breach response baseline.
Date: 2026-05-14

These playbooks are deliberately short. Use them with
`incident-response-plan.md`, `breach-classification.md`, and
`breach-notification-workflow.md`.

## Account Takeover

Triggers:

- suspicious WorkOS login;
- user reports unauthorized changes;
- admin/owner account challenged or compromised;
- unexpected provider connection/disconnect, export, deletion, or billing
  action.

Actions:

1. Set severity High; Critical if admin, token, payment, export, or cross-tenant
   access is involved.
2. Open incident record and preserve WorkOS user/session/Radar events.
3. Revoke active sessions for affected user through WorkOS if compromise is
   likely.
4. Review `audit_logs` for user actions: profile, assets, exports, deletion,
   provider connections, billing, admin actions.
5. Suspend account only if needed to stop ongoing harm.
6. Identify data accessed or changed.
7. Assess GDPR notification and user notice.
8. Remediate root cause: user guidance, MFA/step-up, admin policy, suspicious
   provider token rotation.

## Token Leaks

Triggers:

- secret in GitHub, Vercel/Railway logs, CI artifact, support ticket, browser,
  or analytics payload;
- WorkOS/Stripe/provider token copied into public or internal channel.

Actions:

1. Classify Critical for production secrets/sessions/provider tokens.
2. Revoke/rotate token immediately.
3. Preserve where/when token was exposed without copying the token.
4. Search logs/artifacts for exposure window.
5. Check provider logs for token use.
6. Rotate dependent secrets if chain risk exists.
7. Remove public artifacts/caches.
8. Assess whether personal data could have been accessed.

## Cross-Tenant Exposure

Triggers:

- artist sees another artist's dashboard/profile/EPK/subscriber/analytics data;
- API returns resource with mismatched artist/user ID;
- public/private route leaks another tenant's private content.

Actions:

1. Classify Critical.
2. Disable affected endpoint/feature or roll back deploy.
3. Preserve request IDs, URLs without query strings, affected resource IDs, user
   IDs, and timestamps.
4. Identify exposure window and affected tenants.
5. Patch authorization/ownership logic and add regression tests.
6. Review logs for actual access/download.
7. Assess authority and user notification.
8. Add a postmortem follow-up for guard-level detection.

## Analytics Overexposure

Triggers:

- PostHog/Umami event includes email/name/token/payment/contact content;
- analytics initializes before consent;
- dashboard shows another artist's metrics;
- session replay/autocapture enabled without review.

Actions:

1. Classify Medium to High; Critical if sensitive/private/cross-tenant data is
   exposed broadly.
2. Disable offending event/provider initialization if still active.
3. Identify event names, properties, affected users, and ingestion window.
4. Request provider-side deletion if identifiable/sensitive data was ingested.
5. Patch event schema and add tests/review notes.
6. Assess consent, policy, and notification impact.

## Credential Exposure

Triggers:

- `WORKOS_API_KEY`, `WORKOS_COOKIE_PASSWORD`, Stripe secret/webhook secret,
  database URL, S3/R2 keys, PostHog key/secret, Shopify/Printful tokens,
  GitHub/Vercel/Railway token exposure.

Actions:

1. Classify Critical for production or admin-capable credentials.
2. Rotate the exposed credential and any dependent credentials.
3. Invalidate sessions/tokens if auth material is involved.
4. Review provider access logs for use during exposure window.
5. Remove exposure from logs/artifacts where possible.
6. Assess data access and user notification need.
7. Add prevention: secret scanning, artifact controls, logging redaction.

## Accidental Public Exposure

Triggers:

- private asset becomes publicly reachable;
- GitHub artifact/log contains personal data;
- private page/EPK/preview indexed or shared;
- public bucket policy exposes objects unexpectedly.

Actions:

1. Classify High or Critical depending data.
2. Remove or restrict exposure immediately.
3. Preserve evidence: URL, object key, timestamps, cache/index status.
4. Purge CDN/cache if applicable.
5. Check access logs/downloads if available.
6. Notify search/provider for removal if indexed.
7. Assess affected people and notification need.

## Database Exposure

Triggers:

- database URL leaked;
- unauthorized DB connection;
- unsafe admin/reporting access;
- backup dump exposed;
- destructive migration/data loss with personal data impact.

Actions:

1. Classify Critical.
2. Rotate DB credentials and block unauthorized access.
3. Preserve connection logs and provider evidence.
4. Identify tables/records potentially accessed.
5. Avoid restoring from backup until privacy impact is understood.
6. Validate tenant isolation and secrets after containment.
7. Prepare GDPR authority notification unless evidence clearly shows no risk.
8. Prepare user notice if high risk is likely.

## Third-Party Compromise

Triggers:

- WorkOS, Stripe, PostHog, Vercel, Railway, storage, Resend/EmailJS, Spotify,
  YouTube/Google, SoundCloud, Shopify, Printful, GitHub notice;
- provider token abuse;
- provider-side logs/data exposure.

Actions:

1. Classify High until scope is known; Critical if sensitive StageLink data,
   auth/session, payment, or broad exposure is likely.
2. Open provider security/privacy ticket.
3. Record provider notice time and ticket ID.
4. Request affected data categories, exposure window, regions, and mitigation.
5. Correlate with StageLink logs.
6. Decide if StageLink must notify authority/users.
7. Rotate integration credentials if provider token risk exists.
8. Update provider evidence register and postmortem.

## Backup/Restore Privacy Incident

Triggers:

- restore reintroduces deleted account/data;
- backup includes data promised deleted;
- backup dump stored in unsafe location;
- restore target exposes production personal data.

Actions:

1. Classify High; Critical if backup is public or broadly accessible.
2. Restrict/delete unsafe backup copies.
3. Identify data categories and retention/deletion conflicts.
4. Verify restore target access controls.
5. Reapply deletion/anonymization if restored data violates lifecycle promises.
6. Document recovery decisions and affected users.

## Common Closure Checklist

- Incident record complete.
- Severity reviewed and final.
- Evidence preserved or linked securely.
- GDPR authority/user notice decisions recorded.
- Root cause fixed or accepted risk documented.
- Monitoring confirms no recurrence.
- Follow-up tasks created with owners.
