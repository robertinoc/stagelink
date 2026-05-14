# Incident Registry Structure

Status: Privacy Plan - incident and breach response baseline.
Date: 2026-05-14

StageLink does not need a heavy incident-management platform for the current
startup stage. It does need one reliable incident register that can survive
handoffs, support GDPR accountability, and avoid storing unnecessary personal
data.

## Registry Storage

Current recommended implementation:

- Use a private owner-only tracker outside public git for live incidents.
- Keep sanitized public-safe summaries in docs only after closure if useful.
- Do not store raw evidence, exports, screenshots with personal data, tokens, or
  provider payloads in git.
- Link to provider consoles, log queries, or secure evidence folders instead of
  copying sensitive data into the register.

Future implementation:

- Add an internal `security_incidents` table only when incident volume or audit
  needs justify it.
- Keep access owner/admin-only.
- Add immutable audit events for incident creation, severity change,
  notification decision, and closure.

## Incident ID Format

Use:

```text
SL-INC-YYYYMMDD-NNN
```

Example:

```text
SL-INC-20260514-001
```

## Registry Fields

| Field                         | Required                                | Notes                                                                      |
| ----------------------------- | --------------------------------------- | -------------------------------------------------------------------------- |
| incidentId                    | Yes                                     | Stable ID. Never reuse.                                                    |
| title                         | Yes                                     | Short factual title, no panic language.                                    |
| category                      | Yes                                     | Security, privacy, personal-data breach, operational, third-party.         |
| severity                      | Yes                                     | Critical, High, Medium, Low.                                               |
| status                        | Yes                                     | Open, contained, monitoring, resolved, postmortem complete, closed.        |
| detectionTimeUtc              | Yes                                     | First known detection time in UTC.                                         |
| reportedBy                    | Yes                                     | User, provider, internal alert, engineer, support, automated check.        |
| incidentCommander             | Yes for High/Critical                   | One owner for coordination.                                                |
| privacyReviewer               | Yes when personal data may be involved  | Can be founder/privacy owner until counsel is engaged.                     |
| legalReviewer                 | Required for likely breach notification | External counsel or designated legal contact.                              |
| systemsAffected               | Yes                                     | API, web, DB, WorkOS, Stripe, PostHog, storage, Vercel, Railway, provider. |
| tenantsAffected               | Yes if known                            | IDs/counts only; avoid names unless necessary.                             |
| usersAffectedEstimate         | Yes                                     | Exact, range, or unknown.                                                  |
| dataCategories                | Yes if personal data may be involved    | Use data classification labels.                                            |
| exposureWindow                | Yes for High/Critical                   | Start/end with confidence level.                                           |
| containmentActions            | Yes                                     | Action, owner, timestamp.                                                  |
| evidenceLinks                 | Yes for High/Critical                   | Links to secure evidence. No raw secrets.                                  |
| providerTickets               | If applicable                           | Provider ticket IDs and timestamps.                                        |
| gdprRiskAssessment            | If personal data involved               | No risk, unlikely risk, risk, high risk, unknown.                          |
| authorityNotificationDecision | If personal data involved               | Notify, do not notify, pending legal review.                               |
| userNotificationDecision      | If personal data involved               | Notify, do not notify, pending.                                            |
| remediationActions            | Yes                                     | Fixes, rotations, patches, deletes, config changes.                        |
| recoveryActions               | If applicable                           | Restore, rollback, replay, verification.                                   |
| postmortemLink                | High/Critical                           | Sanitized link/summary.                                                    |
| closedAtUtc                   | On closure                              | UTC timestamp.                                                             |

## Audit-Safe Logging Standards

Incident notes may include:

- user IDs, tenant/artist IDs, asset IDs, request IDs;
- high-level data categories;
- timestamps, provider ticket IDs, commit SHAs;
- counts and ranges;
- sanitized paths without query strings;
- hash or prefix of a token only if needed for matching.

Incident notes must not include:

- WorkOS access/session tokens, cookies, authorization headers, PKCE codes;
- provider API tokens, Stripe secrets, webhook signatures;
- raw card/payment details;
- full DSAR export payloads;
- subscriber/contact-form message bodies;
- full screenshots of private dashboards unless stored in a secure evidence
  folder;
- raw database dumps or logs with unredacted personal data.

## Evidence Collection Guidelines

For High/Critical incidents:

1. Preserve logs before retention windows expire.
2. Record exact UTC timestamps and timezone used by each provider console.
3. Export only the minimum evidence needed.
4. Store evidence in a restricted folder, not git or PR comments.
5. Keep original evidence read-only when practical.
6. Record who accessed evidence.
7. Redact user-facing or PR-facing summaries.

## Timestamp Requirements

- Use UTC for incident registry timestamps.
- Record local timezone only as context when provider consoles force it.
- Keep both detection time and confirmation time.
- For GDPR 72-hour assessment, use the time StageLink became aware of a
  likely personal-data breach, not the time root cause was fully known.

## Suggested Status Model

| Status              | Meaning                                           |
| ------------------- | ------------------------------------------------- |
| Open                | Incident is being triaged.                        |
| Confirmed           | Evidence supports the incident category/severity. |
| Contained           | Active exposure or attacker path is stopped.      |
| Monitoring          | Fix is deployed; watching for recurrence.         |
| Resolved            | User/system impact is addressed.                  |
| Postmortem complete | Lessons and follow-ups captured.                  |
| Closed              | No more active work except backlog items.         |

## Future Database Shape

If StageLink later implements an internal registry table:

```sql
security_incidents(
  id text primary key,
  title text not null,
  category text not null,
  severity text not null,
  status text not null,
  detection_time timestamptz not null,
  reported_by text not null,
  incident_commander_user_id text,
  privacy_reviewer text,
  systems_affected jsonb not null default '[]',
  data_categories jsonb not null default '[]',
  users_affected_estimate text,
  gdpr_risk_assessment text,
  authority_notification_decision text,
  user_notification_decision text,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  closed_at timestamptz
);
```

Keep evidence blobs outside the database unless there is a clear operational
need and access controls are strong enough.
