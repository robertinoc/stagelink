# Breach Communication Templates

Status: Privacy Plan - incident and breach response baseline.
Date: 2026-05-14

These templates are starting points. Do not send externally without confirming
facts, severity, affected data, and legal/privacy review.

## Internal Incident Escalation

```text
Subject: [SL-INC-YYYYMMDD-NNN] [Severity] [Category] - [short title]

Incident ID:
Detected at (UTC):
Reporter/source:
Current severity:
Incident commander:
Systems affected:
Known or suspected personal data:
Affected users/tenants estimate:
Current status:

What happened:
[Brief factual summary. Separate confirmed facts from assumptions.]

Immediate actions taken:
- [Action, owner, timestamp]

Decisions needed:
- [Containment / provider escalation / legal review / user notice]

Next update:
[Time in UTC]
```

## Executive Summary

```text
Incident ID:
Severity:
Status:
Detection time (UTC):
Breach awareness time (UTC, if applicable):

Summary:
[2-4 sentences: what happened, impact, current state.]

Impact:
- Systems:
- Data categories:
- Users/tenants affected:
- Business/customer impact:

Containment:
[What has stopped the exposure or reduced risk.]

Notification posture:
- Supervisory authority: [notify / do not notify / pending]
- Users: [notify / do not notify / pending]
- Providers: [tickets opened / not applicable]

Next actions:
- [Owner, action, due time]
```

## Supervisory Authority Notification Draft

```text
Controller:
StageLink [legal entity pending final confirmation]

Contact point:
[privacy/security contact email]

Date/time of awareness:
[UTC timestamp]

Nature of the personal data breach:
[Describe confidentiality/integrity/availability issue in factual terms.]

Categories of affected data subjects:
[Artists, account users, visitors, subscribers/fans, admins, etc.]

Approximate number of affected data subjects:
[Exact/range/unknown with explanation]

Categories of affected personal data:
[Email, name, profile data, analytics, subscriber/contact data, payment references, auth/session data, etc.]

Approximate number of affected records:
[Exact/range/unknown]

Likely consequences:
[Risk of phishing, unauthorized account access, public exposure, cross-tenant confidentiality loss, financial/billing impact, etc.]

Measures taken or proposed:
- [Containment]
- [Remediation]
- [Monitoring]
- [User support]

Data processor/provider involvement:
[Provider name, ticket ID, notice time, known scope]

User communication:
[Sent/planned/not planned and rationale]

Information gaps:
[What is still unknown and when StageLink expects to update.]
```

## User Notification Draft

```text
Subject: Important notice about your StageLink account/data

Hi [name],

We are writing to tell you about a security/privacy incident involving
StageLink.

What happened:
[Plain-language summary with dates/times if known.]

What information was involved:
[Specific data categories. Do not overstate. Do not include unrelated data.]

What we have done:
- [Containment action]
- [Remediation action]
- [Monitoring/support action]

What you can do:
- [Sign out/sign in again, reset provider token, watch for phishing, review account settings, etc.]

What was not involved:
[Only include if confirmed, for example: "We have no evidence that card numbers were exposed because Stripe processes card details directly."]

We are continuing to monitor and will provide updates if material facts change.

Contact:
[privacy/security contact email]
```

## Third-Party Provider Escalation

```text
Subject: Security/privacy incident escalation - StageLink - [incident id]

Provider:
StageLink account/workspace:
Incident ID:
Severity:
Detected at (UTC):

We are investigating a potential security/privacy incident involving your
service and StageLink data.

Systems/data involved:
[Provider project/account, data categories, suspected exposure window.]

Request:
- Confirm whether your systems processed or exposed the listed data.
- Provide relevant logs, access timeline, regions, subprocessors if applicable.
- Confirm containment/remediation actions.
- Confirm whether any provider-side personnel or third parties accessed data.
- Confirm retention/deletion options for affected data/logs.

Urgency:
[Critical/High/Medium. Mention GDPR 72-hour assessment if personal data may be involved.]

Please reply with a ticket ID and security/privacy contact.
```

## Public Status Note

Use only if needed for a broad active incident.

```text
We are investigating an issue affecting [feature/system]. We have taken
immediate steps to contain the issue and are reviewing whether any personal data
was affected. We will update affected users directly if action is required.
```

Avoid:

- "No data was affected" unless confirmed.
- "Fully secure" or "impossible to happen again."
- Naming a provider as responsible before evidence confirms it.
- Sharing indicators that help attackers.
