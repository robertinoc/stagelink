# Analytics Opt-Out

Status: Privacy Plan - analytics and profiling baseline.
Date: 2026-05-14

StageLink must let users disable non-essential analytics and revoke analytics
consent without breaking core product flows.

## Current Opt-Out System

Visitor/public analytics:

- first visit defaults to analytics off;
- Reject Non-Essential stores analytics=false;
- Customize allows analytics toggle;
- Privacy floating control reopens preferences;
- withdrawal dispatches a consent change event;
- PostHog browser capture opts out/resets and known local identifiers are
  removed;
- local public analytics API calls are blocked by `isAnalyticsAllowed()` or
  server-side `hasTrackingConsent` checks.

Marketing:

- marketing category exists but no active marketing pixels are implemented.

Necessary telemetry:

- auth/session, security, rate limiting, audit, billing, and operational logs
  continue where necessary and are not part of optional analytics opt-out.

## Opt-Out Requirements

| Requirement                             | Current status                                                               | Notes                                                 |
| --------------------------------------- | ---------------------------------------------------------------------------- | ----------------------------------------------------- |
| Persistent preference                   | Implemented                                                                  | `sl_consent` lifetime 180 days.                       |
| Reversible setting                      | Implemented                                                                  | preferences can be changed.                           |
| No analytics before consent             | Implemented for public/browser analytics                                     | Product server analytics needs separate posture.      |
| Provider opt-out/reset                  | Implemented best effort for PostHog browser                                  | Validate after SDK upgrades.                          |
| Global opt-out across public analytics  | Implemented for local public events and PostHog browser/server public events | Depends on `X-SL-AC` forwarding.                      |
| Authenticated product analytics opt-out | Not implemented                                                              | Needs policy/product decision.                        |
| Server-side consent history             | Not implemented                                                              | Not required unless regulator-grade ledger is needed. |

## User-Facing Controls

Current:

- cookie banner;
- preferences dialog;
- floating Privacy control.

Recommended:

- add footer link;
- add dashboard privacy/settings entry that opens same preferences;
- document account-level product analytics preference or objection process;
- clarify that necessary security, fraud, auth, billing, and audit logs cannot
  be disabled.

## Opt-Out Semantics

When analytics is disabled:

- do not initialize PostHog browser SDK;
- do not send browser PostHog events;
- do not send browser link-click API analytics;
- do not persist public page view/link/smart-link/fan-capture analytics;
- do not set new PostHog browser identifiers;
- delete known PostHog storage/cookies best effort.

When analytics is disabled, StageLink may still:

- authenticate users;
- route public pages and smart links;
- process billing;
- store subscriber records when submitted with required form consent;
- write audit/security/rate-limit logs;
- keep DSAR/account deletion records required for accountability.

## Opt-Out Gaps

### Product Analytics

Authenticated server-side PostHog product events are not currently controlled by
the cookie banner. Before public scale, StageLink should choose one:

1. Add authenticated product analytics preferences; or
2. keep product analytics under documented legitimate interests with clear
   objection handling and minimal event payloads.

### Provider-Side Deletion

PostHog withdrawal cleanup prevents new browser capture, but historical provider
events are not automatically deleted. StageLink needs a provider deletion
runbook for:

- DSAR erasure;
- consent withdrawal where deletion is required by policy;
- accidental overcollection.

### Cross-Device

Current consent is browser/cookie-specific. If StageLink later adds account-wide
or cross-device product analytics preferences, define precedence:

- account opt-out should override browser analytics where user is authenticated;
- anonymous public visitor consent remains browser-specific.

## Test Checklist

- no `ph_` or PostHog storage before consent;
- no public analytics DB row when `sl_ac=0` or absent;
- no PostHog public event when consent absent;
- Accept All enables public analytics;
- Reject Non-Essential disables public analytics;
- withdrawal after prior consent stops future capture and removes known
  provider storage;
- public pages and smart-link redirects still work after opt-out.
