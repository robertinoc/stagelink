# Breach Classification

Status: Privacy Plan - incident and breach response baseline.
Date: 2026-05-14

This document classifies privacy/security incidents for StageLink. It is an
operational guide, not legal advice. When in doubt, classify higher for the
first triage window and downgrade only after evidence supports it.

## Incident Categories

| Category             | Definition                                                                                                                                               | StageLink examples                                                                                                       | Default owner                                  |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------- |
| Security incident    | An event that threatens confidentiality, integrity, availability, authentication, authorization, secrets, infrastructure, or admin access.               | WorkOS brute-force attack, leaked API key, suspicious admin role change, Stripe webhook signature failures.              | Technical incident lead                        |
| Privacy incident     | An event that may misuse, over-collect, over-retain, misroute, or improperly expose personal data, even if no external attacker is involved.             | DSAR export sent to wrong account, analytics event includes email, contact-form message logged.                          | Privacy lead                                   |
| Personal data breach | A security or privacy incident that causes accidental or unlawful destruction, loss, alteration, unauthorized disclosure of, or access to personal data. | Cross-tenant analytics exposure, public bucket exposure, compromised session accessing private profile/payment metadata. | Incident commander plus privacy/legal reviewer |
| Operational incident | Availability, deployment, data integrity, or recovery incident that does not initially expose personal data.                                             | Failed deploy, Railway outage, broken analytics sync, failed backup job.                                                 | Engineering owner                              |
| Third-party incident | Provider-side issue that can affect StageLink data, users, secrets, availability, or compliance.                                                         | WorkOS auth incident, Stripe data incident, PostHog project exposure, Vercel/Railway log access issue.                   | Vendor owner plus incident commander           |

## Severity Levels

| Severity | Definition                                                                                                                                                                                | Response urgency                                                                                 | Escalation                                                             | Examples                                                                                                                                                                                         |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Critical | Confirmed or highly likely personal-data breach with sensitive data, auth/session compromise, cross-tenant exposure, payment implications, public exposure, or large affected population. | Immediate response. Start incident clock at detection. Privacy breach assessment within 4 hours. | Founder/owner, technical lead, privacy/legal reviewer, provider owner. | Public access to private database; WorkOS session/token leak; cross-tenant private dashboard data exposure; object bucket exposes private EPK/contact data.                                      |
| High     | Serious incident with credible exposure risk, limited confirmed exposure, privileged/admin action anomaly, or provider breach affecting StageLink data.                                   | Same business day; initial containment within 8 hours where feasible.                            | Technical lead, privacy owner, impacted provider owner.                | Admin account suspicious login; analytics event accidentally includes emails; repeated unauthorized access attempts against tenant resources; EmailJS/Resend incident with message content risk. |
| Medium   | Limited incident with no confirmed external exposure, low-sensitivity data, or contained operational failure with possible privacy impact.                                                | Triage within 1 business day.                                                                    | Owning engineer plus privacy review if personal data is involved.      | Failed audit logging, rate-limit spike, accidental internal log of user ID/email, failed DSAR export generation.                                                                                 |
| Low      | Minor anomaly, blocked attempt, documentation/process gap, or harmless operational issue with no personal-data exposure.                                                                  | Review in normal backlog or weekly check.                                                        | Owning engineer.                                                       | Single blocked 403 attempt, non-sensitive provider warning, duplicate webhook already idempotently ignored.                                                                                      |

## Escalation Rules

- Any suspected personal-data breach starts at High or Critical until assessed.
- Any cross-tenant exposure starts at Critical.
- Any auth token, WorkOS session, cookie, provider API token, Stripe secret, or
  admin credential exposure starts at Critical.
- Any public exposure of private user, subscriber, contact-form, billing,
  support, DSAR, or audit data starts at Critical.
- Any provider incident that could involve StageLink personal data starts at
  High until provider evidence proves otherwise.
- Operational outages without personal-data risk can remain Medium or Low, but
  must be reclassified if recovery requires restoring personal data from backup
  or exposes logs/artifacts.

## Breach Severity Matrix

Use the highest applicable row. Counts are a guide; data sensitivity and public
exposure can raise severity even with one affected user.

| Factor                          | Critical                                                                                                                              | High                                                                          | Medium                                                               | Low                                           |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- | -------------------------------------------------------------------- | --------------------------------------------- |
| Affected user count             | >100 users, unknown count, or broad tenant class                                                                                      | 10-100 users                                                                  | 1-9 users                                                            | No personal data or blocked attempt           |
| Data sensitivity                | Auth/session tokens, provider tokens, Stripe/customer data, contact messages, subscriber data, DSAR exports, private EPK/contact data | Email/name plus private account metadata; analytics tied to identifiable user | Pseudonymous analytics, public profile drafts, low-risk internal IDs | Public content only or non-personal telemetry |
| Public exposure risk            | Indexed, public bucket/CDN, public PR/log/artifact, public page leak                                                                  | Accessible to another authenticated user or provider support channel          | Internal team only, short-lived, contained                           | No disclosure                                 |
| Payment implications            | Stripe customer/payment references exposed or billing state manipulated                                                               | Subscription/customer metadata exposed                                        | Billing entitlement display issue only                               | No payment impact                             |
| Authentication/session exposure | Active session, cookie, bearer token, WorkOS secret, admin credential, OAuth/provider token                                           | Suspicious admin login or repeated WorkOS challenge anomaly                   | Failed auth flow with no token exposure                              | Blocked attempt                               |
| Cross-tenant exposure           | Any private resource visible across tenants                                                                                           | Attempted cross-tenant access with partial metadata exposure                  | Blocked access attempts with logs only                               | No tenant impact                              |
| Legal implications              | Likely GDPR authority notification, possible user notification, regulator/media risk                                                  | Breach assessment required; notification possible                             | Internal record required; legal review if pattern repeats            | Track as security hygiene                     |

## Breach Reporting Matrix

| Incident type              | Notification requirement                                                                | Escalation level | Legal/privacy implications                                     | User notification necessity                                                 | Response SLA                                 |
| -------------------------- | --------------------------------------------------------------------------------------- | ---------------- | -------------------------------------------------------------- | --------------------------------------------------------------------------- | -------------------------------------------- |
| Account takeover           | Assess if attacker accessed personal data. Notify authority if risk to rights/freedoms. | High or Critical | Session/auth evidence, WorkOS logs, affected resources.        | Required if high risk or protective action needed.                          | Triage immediately; contain within hours.    |
| Token/session leak         | Presumed Critical until revoked and scope known.                                        | Critical         | Could enable unauthorized access; document exposure window.    | Likely if personal data could be accessed or users must rotate credentials. | Revoke/rotate immediately.                   |
| Cross-tenant exposure      | Presumed reportable breach.                                                             | Critical         | Strong tenant-isolation and confidentiality impact.            | Likely required for affected tenants/users.                                 | Immediate containment and evidence freeze.   |
| Analytics overexposure     | Depends on data categories and identifiability.                                         | Medium to High   | Consent/privacy policy and processor data handling review.     | Needed if identifiable or sensitive behavioral data exposed.                | Triage same day.                             |
| Credential exposure        | Critical for production secrets/admin/provider tokens.                                  | Critical         | Rotate, assess logs/artifacts and provider access.             | Usually not unless user data accessed or user action needed.                | Rotate immediately.                          |
| Accidental public exposure | High or Critical depending data and indexing.                                           | High or Critical | Determine duration, crawlers, cache, downloads.                | Likely if private personal data was public.                                 | Remove immediately; preserve evidence.       |
| Database exposure          | Critical.                                                                               | Critical         | Full breach assessment, authority notice likely.               | Likely required unless evidence proves no risk.                             | Immediate containment.                       |
| Third-party compromise     | High until provider confirms scope.                                                     | High or Critical | Contract/DPA notice, provider evidence, transfer implications. | Depends on affected data and provider findings.                             | Contact provider same day; preserve notices. |
| Operational outage only    | Usually no breach notification.                                                         | Low to Medium    | Track if backups/logs contain personal data.                   | No unless data loss affects user rights.                                    | Restore by product SLA/backlog priority.     |

## Minimum Record for Every High/Critical Incident

- incident id;
- detection timestamp in UTC;
- reporter/source;
- category and severity;
- systems affected;
- data categories possibly affected;
- affected user/tenant estimate;
- containment action and timestamp;
- decision on GDPR authority notification;
- decision on user notification;
- remediation owner;
- closure timestamp;
- postmortem link or summary.
