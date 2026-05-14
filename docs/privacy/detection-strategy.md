# Incident Detection Strategy

Status: Privacy Plan - incident and breach response baseline.
Date: 2026-05-14

This document defines realistic detection for StageLink's current architecture.
It assumes no dedicated SOC. The goal is actionable signals that a small team
can review and escalate quickly.

## Current Detection Surfaces

| Surface             | Current source                                                    | Useful for                                                             |
| ------------------- | ----------------------------------------------------------------- | ---------------------------------------------------------------------- |
| API security logs   | `security_event=...` in Railway logs                              | 5xx spikes, client-error spikes, rate-limit abuse.                     |
| Audit logs          | PostgreSQL `audit_logs`                                           | Sensitive actions, admin changes, DSAR, uploads, provider connections. |
| WorkOS              | WorkOS dashboard/Radar/user events                                | Auth anomalies, brute force, session issues, admin login risk.         |
| Stripe              | Stripe Dashboard and `stripe_webhook_events`                      | Webhook failures, replay/duplicate handling, billing anomalies.        |
| Vercel              | Web runtime/deploy logs                                           | Auth callback failures, proxy failures, public route errors.           |
| Railway             | API/runtime/database logs                                         | API errors, deployment/runtime failures, suspicious request patterns.  |
| PostHog             | Product analytics project                                         | Analytics spikes or unexpected events after consent.                   |
| GitHub Actions      | CI checks/artifacts                                               | Secret leaks, failing security audit, artifact exposure.               |
| Provider dashboards | Vercel, Railway, WorkOS, Stripe, PostHog, Resend/EmailJS, storage | Provider-side incident notices and logs.                               |

## Priority Signals

### Authentication Anomalies

Monitor:

- WorkOS Radar detections for admin/owner users;
- repeated login failures or bot challenges;
- auth callback errors in Vercel;
- new login from unusual geography/device for owner/admin accounts where WorkOS
  exposes it;
- suspended/deleted users attempting access.

Alert threshold:

- Critical: any confirmed admin/owner session compromise or token leak.
- High: repeated WorkOS challenges for owner/admin, suspicious successful login,
  or auth callback spike after deploy.

Recommended improvements:

- Decide admin/operator MFA before public launch.
- Add owner-only review checklist for WorkOS user events during incidents.
- Add a simple weekly owner/admin login review until automated alerts exist.

### Suspicious API Access

Monitor:

- `security_event=http.client_error` spikes by path/status/user/request ID;
- `security_event=http.error` spikes;
- repeated 401/403/404 against private endpoints;
- abnormal request volume to export, asset upload, insights sync, billing, and
  admin endpoints.

Alert threshold:

- High: repeated 403/404 attempts against tenant resources by same actor/IP.
- Medium: sustained 4xx/429 spikes without confirmed exposure.

Recommended improvements:

- Add route-level counters for sensitive endpoints.
- Add request ID to more audit events.
- Move in-memory rate limiting to Redis/Upstash before sustained public traffic.

### Cross-Tenant Access Attempts

Monitor:

- authorization failures involving mismatched `artistId`, `pageId`, `assetId`,
  `subscriptionId`, or insights connection IDs;
- bug reports showing another artist's data;
- dashboard data that includes unexpected artist IDs;
- 404/403 patterns after ID guessing.

Alert threshold:

- Critical: any confirmed private data visible across tenants.
- High: repeated blocked cross-tenant attempts against private IDs.

Recommended improvements:

- Add explicit audit/security events for denied tenant checks on sensitive
  resources.
- Add test coverage for tenant scoping on new endpoints.
- Consider database RLS later if reporting/direct DB access expands.

### Abnormal Analytics Behavior

Monitor:

- PostHog initializing before consent;
- analytics events containing email, names, tokens, payment data, contact
  message content, or provider tokens;
- sudden spikes in raw analytics events from one IP/session;
- dashboards showing impossible totals or another artist's metrics;
- third-party embed behavior that sets cookies before interaction.

Alert threshold:

- High: identifiable personal data sent to analytics provider without a lawful
  basis/consent.
- Medium: analytics quality spike, bot traffic, or dashboard anomaly with no
  personal-data exposure.

Recommended improvements:

- Add analytics payload lint/review rule for new events.
- Keep autocapture/session replay off unless separately reviewed.
- Add periodic PostHog event-property review.

### Excessive Exports or Downloads

Monitor:

- repeated `/api/privacy/export` requests;
- subscriber export/list access;
- asset download/presigned URL unusual volume;
- admin user searches/detail views once audit coverage exists.

Alert threshold:

- Critical: suspicious bulk export of private/subscriber/DSAR data.
- High: repeated exports by same user/admin within short window.

Recommended improvements:

- Add rate limits and audit events for DSAR exports and subscriber exports.
- Add owner-only alert for repeated export actions.

### Suspicious Admin Actions

Monitor:

- `admin.*` audit logs;
- Redis `behind:role_audit`;
- `BEHIND_ADMIN_EMAILS` changes in environment configuration;
- invitation creation and role changes;
- debug-header access if enabled.

Alert threshold:

- Critical: unauthorized owner/admin role grant or admin session compromise.
- High: unexpected user suspension/deletion/status change.

Recommended improvements:

- Add audit events for admin user search/detail access.
- Add owner-only audit viewer.
- Require MFA/step-up for Behind owner actions before public scale.

### Token and Session Anomalies

Monitor:

- tokens or cookies in logs/artifacts;
- GitHub Actions artifacts with `.auth` or browser storage;
- provider token validation failures;
- repeated invalid Stripe webhook signatures;
- Shopify/Printful token use after disconnect.

Alert threshold:

- Critical: production token/secret/session exposure.
- High: repeated signature failures or provider token misuse.

Recommended improvements:

- Add artifact scan for auth/session files.
- Add recurring secret scan beyond Dependabot/audit.
- Rotate provider secrets after suspected exposure; do not wait for proof of
  use.

### Infrastructure Alerts

Monitor:

- Railway API crash loops, DB connection failures, migration errors;
- Vercel deploy failures or sudden route-handler errors;
- storage upload confirmation failures;
- backup/restore drill failures;
- provider incident notices.

Alert threshold:

- Critical: database exposure, destructive migration, or loss of production
  data.
- High: audit-log write failures, backup failures near launch, storage public
  exposure.

Recommended improvements:

- Enable managed DB backups before public launch or 100 users.
- Add external alerting for `Failed to write audit log`.
- Add object-storage lifecycle/deletion verification.

## Startup-Ready Alerting Plan

### Private QA

- Manual daily review of Railway/Vercel error logs during active test windows.
- Review WorkOS Radar after auth/E2E failures.
- Review `audit_logs` for admin/privacy/export/delete actions after privacy QA.
- Keep CI dependency audit required.

### Public Launch Minimum

- Alert on API 5xx spikes.
- Alert on repeated `rate_limit.exceeded`.
- Alert on WorkOS admin/owner anomalies.
- Alert on `Failed to write audit log`.
- Alert on Stripe webhook signature failures.
- Alert on storage upload confirmation rejection spikes.
- Alert on provider incident notices.

### Later Automation

- Central log drain to Sentry/Logtail/Datadog/OpenTelemetry-compatible tool.
- Alert routing to a small incident channel.
- Scheduled queries for export/admin/cross-tenant anomalies.
- Security dashboard showing open incidents and high-risk audit events.

## Blind Spots

| Blind spot                                                      | Severity | Practical next step                                            |
| --------------------------------------------------------------- | -------- | -------------------------------------------------------------- |
| No central alerting/log drain                                   | High     | Add one external alerting tool before public scale.            |
| Admin view/search audit incomplete                              | High     | Add audit events for Behind user views/searches.               |
| DSAR/subscriber export rate alerting missing                    | High     | Add audit + rate limits + owner alert.                         |
| Cross-tenant denied-access signals are not consistently audited | High     | Add structured security events in membership/ownership guards. |
| Provider log retention unknown                                  | High     | Complete provider evidence register.                           |
| No managed DB backup on current Railway Hobby plan              | High     | Enable managed backups before public launch or 100 users.      |
| Audit metadata is flexible JSON                                 | Medium   | Add typed metadata helpers for sensitive modules.              |
