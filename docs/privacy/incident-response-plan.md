# Incident Response Plan

Status: Privacy Plan - incident and breach response baseline.
Date: 2026-05-14

This plan covers StageLink privacy/security incidents and personal-data
breaches. It is designed for a small startup team, not a dedicated SOC.

## Objectives

- Stop active harm quickly.
- Preserve enough evidence to understand scope.
- Protect user rights and tenant confidentiality.
- Meet GDPR breach assessment and notification obligations where applicable.
- Recover safely without reintroducing exposure.
- Capture follow-ups without overbuilding process.

## Roles

| Role                 | Who can fill it today                        | Responsibility                                                               |
| -------------------- | -------------------------------------------- | ---------------------------------------------------------------------------- |
| Incident commander   | Founder/technical lead                       | Owns coordination, timeline, severity, status, and decisions.                |
| Technical lead       | Engineer closest to affected system          | Triage, containment, remediation, recovery verification.                     |
| Privacy reviewer     | Founder/privacy owner                        | Determines personal-data categories, user impact, notification need.         |
| Legal reviewer       | External counsel or designated legal contact | Reviews GDPR/regulatory/user notification decisions.                         |
| Communications owner | Founder/operator                             | Internal status, user/provider messages, support notes.                      |
| Provider owner       | Engineer/operator with console access        | WorkOS, Stripe, Vercel, Railway, PostHog, storage, email, GitHub escalation. |

One person may hold multiple roles, but every High/Critical incident must have
one named incident commander.

## Response Workflow

### 1. Detection

Sources:

- user/support report;
- WorkOS, Stripe, Vercel, Railway, PostHog, storage, email, or GitHub notice;
- `security_event=...` logs;
- `audit_logs`, `dsar_requests`, `stripe_webhook_events`;
- CI/security audit failure;
- engineer observation.

Immediate actions:

- Create incident id using `SL-INC-YYYYMMDD-NNN`.
- Record detection time in UTC.
- Capture source and first known evidence link.
- Classify initial category/severity using `breach-classification.md`.

### 2. Triage

Goal: determine if this is a personal-data breach or could become one.

Questions:

- What system is affected?
- Is personal data involved?
- Is the exposure active?
- Is data public, cross-tenant, provider-side, or attacker-accessible?
- Are sessions, tokens, admin access, or payment data involved?
- How many users/tenants may be affected?
- Is the affected data sensitive or likely to create risk to rights/freedoms?

Triage output:

- severity;
- breach assessment state: not personal data, possible breach, confirmed breach,
  unlikely breach after evidence;
- containment owner;
- next update time.

### 3. Containment

Containment examples:

- disable affected route/feature/provider integration;
- revoke WorkOS sessions;
- rotate leaked secrets/tokens;
- suspend compromised account;
- remove public object/link/page exposure;
- block abusive IP/rate limit path;
- roll back deploy;
- disable analytics provider initialization;
- pause admin actions if audit logging is failing;
- contact provider and request containment evidence.

Containment rules:

- Do not destroy evidence unless required to stop exposure.
- Record every containment action with timestamp.
- Prefer narrow containment first, but do not hesitate to disable a feature for
  Critical incidents.

### 4. Investigation

Evidence to review:

- application logs by request ID and timestamp;
- `audit_logs` for actor/resource/action;
- WorkOS user/session/Radar events;
- Stripe event dashboard and `stripe_webhook_events`;
- Vercel/Railway deploy and runtime logs;
- PostHog event properties and ingestion time;
- storage object ACLs, access logs if available, object metadata;
- GitHub Actions logs/artifacts for secret/auth exposure;
- provider incident notices and support tickets.

Evidence rules:

- Use UTC timeline.
- Store sensitive evidence outside git.
- Redact in PRs, Slack-like channels, and user-facing summaries.
- Track confidence: confirmed, likely, possible, unknown.

### 5. Remediation

Remediation examples:

- code patch and deploy;
- permission check fix;
- token rotation and provider credential reset;
- WorkOS session revocation;
- storage ACL/lifecycle correction;
- analytics event schema fix and provider-side deletion request;
- DSAR/export rate limit or audit event addition;
- provider configuration change.

Every remediation action needs:

- owner;
- commit/config/provider ticket link;
- deployed/applied timestamp;
- verification result.

### 6. Recovery

Before reopening a disabled feature:

- confirm active exposure stopped;
- verify affected paths with targeted tests;
- confirm audit logging is working;
- confirm rollback/restore did not revive deleted/exposed data incorrectly;
- monitor logs for recurrence.

Recovery must be slower for incidents involving:

- cross-tenant access;
- auth/session compromise;
- database exposure;
- provider token leaks;
- backup/restore operations.

### 7. Postmortem

Required for Critical and High incidents.

Minimum postmortem:

- incident summary;
- timeline;
- root cause or best-known cause;
- impact and data categories;
- detection gap;
- containment/remediation actions;
- notification decisions;
- what worked;
- follow-up tasks with owners and dates.

Keep user-identifiable evidence out of the postmortem unless stored in a
restricted evidence location.

## Escalation Flow

| Trigger                            | Escalate to                                                  |
| ---------------------------------- | ------------------------------------------------------------ |
| Possible personal-data breach      | Incident commander + privacy reviewer.                       |
| Likely GDPR authority notification | Add legal reviewer.                                          |
| High-risk user impact              | Add communications owner before user notice.                 |
| Provider-side incident             | Provider owner opens support/security ticket.                |
| Auth/admin/session compromise      | WorkOS owner, technical lead, founder.                       |
| Payment/billing data risk          | Stripe owner, privacy/legal reviewer.                        |
| Cross-tenant exposure              | Founder, technical lead, privacy/legal reviewer immediately. |

## Communication Flow

Internal:

- Create one incident thread/channel/doc.
- Use incident id in every message.
- Post status updates at agreed intervals for Critical/High incidents.
- Keep facts separate from assumptions.

External:

- Do not notify users before containment unless delay increases harm.
- Do not promise facts not yet known.
- Do not blame providers before evidence is confirmed.
- Use templates in `breach-communication-templates.md`.

## Evidence Handling

Preserve:

- provider notices;
- relevant logs;
- audit rows;
- screenshots of provider settings where needed;
- impacted object/key/resource lists;
- deployed commit SHAs;
- notification decisions.

Do not preserve unnecessarily:

- full database dumps;
- raw DSAR exports;
- full contact-form messages;
- auth cookies/tokens;
- screenshots containing unrelated users.

## Backup and Recovery Implications

Before restoring data:

- confirm whether backup contains exposed, deleted, or unlawful data;
- avoid restoring stale permissions or revoked provider tokens;
- test restore on disposable target where possible;
- document whether restored records affect DSAR erasure/deletion promises;
- re-run affected authorization and privacy checks after restore.

Known current limitation:

- Railway managed automatic backups are deferred until public launch or first
  100 users. Manual backup/restore tooling exists but is not equivalent to
  managed production backup/PITR.

## Third-Party Breach Dependencies

| Provider class          | StageLink dependency                                            | Boundary                                                                                                                              | Incident expectation                                                                                                                                  |
| ----------------------- | --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| WorkOS AuthKit          | Authentication, sessions, Radar, user identity                  | WorkOS operates auth systems; StageLink controls local user/tenant access and session handling through integration.                   | Treat provider auth incident as High/Critical. Review WorkOS user/session events, revoke sessions, confirm whether StageLink local data was accessed. |
| Stripe                  | Checkout, customer portal, subscriptions, webhooks              | Stripe handles card/payment processing; StageLink stores customer/subscription references and entitlement state.                      | Do not claim card data exposure unless Stripe confirms it. Assess Stripe metadata/customer/invoice exposure and local billing state.                  |
| OAuth/API providers     | Spotify, YouTube/Google, SoundCloud, Shopify, Printful/Printify | Some are independent providers/controllers; StageLink stores imported metrics, references, and some encrypted artist-supplied tokens. | Rotate/revoke local tokens where applicable, delete imported local data if needed, and avoid promising provider-side deletion beyond documented APIs. |
| Analytics providers     | PostHog and possible Umami                                      | StageLink controls event selection and consent gating; providers process ingested events.                                             | If event payload overexposes data, disable event/provider, request provider-side deletion, assess consent and breach impact.                          |
| Hosting/infrastructure  | Vercel, Railway, storage/CDN, GitHub Actions                    | Providers host runtime, logs, DB, deployment artifacts, and media.                                                                    | Preserve provider logs/notices, confirm regions/retention/access, and assess whether logs/artifacts/backups contain personal data.                    |
| Email/contact providers | Resend, EmailJS                                                 | Resend is server-side; EmailJS is browser-side for artist contact forms if configured.                                                | Treat message-content exposure as privacy sensitive. Confirm provider retention/subprocessors and consider migration to reviewed server-side path.    |

Responsibility boundary:

- Provider notices do not automatically satisfy StageLink's obligations to its
  users or authorities.
- StageLink must assess its own role, local data, user impact, and notification
  duties.
- Provider evidence should be linked in the incident register, not copied into
  public docs.

## Future TODOs

- Owner-only incident dashboard.
- Central log drain and alerting.
- Automated incident registry table if volume grows.
- Structured guard-level cross-tenant denied-access events.
- Automated DSAR/export/admin anomaly reports.
- Security event retention and deletion jobs.
- Provider evidence links embedded in incident register.
