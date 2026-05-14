# Analytics Consent

Status: Privacy Plan - analytics and profiling baseline.
Date: 2026-05-14

StageLink uses a GDPR-first opt-in model for non-essential public analytics.
This document defines the consent handling requirements and current state.

## Current Consent Model

Consent categories:

- necessary;
- analytics;
- marketing.

Storage:

- `sl_consent`: canonical versioned JSON consent record;
- `sl_ac`: compact compatibility cookie where `1` means analytics accepted and
  `0` means rejected/absent.

Runtime:

- absent, expired, invalid, or old-version consent means analytics is disabled;
- `PostHogProvider` initializes PostHog only after analytics consent;
- `track.ts` returns before PostHog or local link-click API calls unless
  analytics is allowed;
- web/API forwarding uses `X-SL-AC` to persist consent state for allowed
  public analytics events;
- withdrawal rewrites cookies, opts out/resets PostHog, and removes known
  PostHog storage keys on a best-effort basis.

## Consent Blocking Requirements

These must stay blocked before analytics consent:

- PostHog browser initialization;
- PostHog browser capture;
- public page view local analytics persistence;
- public page view server PostHog capture;
- public link-click local analytics persistence;
- public link-click browser PostHog capture;
- smart-link resolution analytics persistence;
- fan-capture analytics event persistence.

These may run without analytics consent because they are necessary or separately
requested:

- public page rendering;
- authentication/session/security cookies;
- locale routing;
- rate limiting and abuse logs;
- billing/Stripe transaction flows requested by the user;
- email capture subscriber creation when form consent/business rules pass;
- audit logs for security/privacy accountability.

## Opt-Out and Withdrawal

Users must be able to:

- reject non-essential tracking on first visit;
- customize analytics and marketing separately;
- reopen the privacy preferences modal;
- withdraw analytics consent;
- keep using StageLink core features after withdrawal.

Current implementation:

- floating Privacy control remains available after a choice;
- consent is persistent for 180 days;
- withdrawal is reversible;
- PostHog browser storage cleanup is best effort.

Needed improvements:

- add a footer/account settings entry point to the same privacy preferences;
- document an authenticated artist product-analytics preference or objection
  path before public scale;
- add server-side consent ledger only if regulator-grade consent history becomes
  necessary.

## Authenticated Product Analytics

Current server-side PostHog product events include:

- onboarding complete;
- artist profile updated;
- block created/updated/deleted/published/unpublished.

These events use actor user ID and artist ID. They are not currently blocked by
the visitor analytics consent cookie because they occur server-side inside
authenticated product workflows.

Required policy decision:

- either treat product analytics under a documented lawful basis with clear
  objection/opt-out handling; or
- gate product analytics behind authenticated user analytics preferences.

Until that decision is final:

- keep product event properties minimal;
- do not send email, full content, free text, tokens, payment data, or contact
  message content to PostHog;
- keep `$process_person_profiles:false`;
- keep autocapture/session replay disabled.

## Consent QA Checklist

- With no `sl_consent`, PostHog does not initialize.
- With `sl_ac=0`, no public analytics events are persisted.
- After Accept All, public page views/link clicks/smart-link/fan-capture
  analytics can be recorded.
- After Reject Non-Essential, public analytics remains blocked.
- After withdrawal, PostHog opt-out/reset runs and known PostHog storage keys
  are removed.
- Public pages, auth, billing, and email capture form operation still work.

## Consent Risk

| Risk                                                           | Severity | Mitigation                                                                                 |
| -------------------------------------------------------------- | -------- | ------------------------------------------------------------------------------------------ |
| Direct imports of `posthog-js` bypass consent helper           | High     | Keep `track.ts` and `PostHogProvider` as the only browser analytics path; add review rule. |
| Product analytics uses actor IDs without separate preference   | High     | Finalize lawful basis and opt-out/preference posture.                                      |
| Provider settings could enable autocapture/replay outside code | High     | Confirm PostHog project settings in provider evidence.                                     |
| Consent stored only client-side                                | Medium   | Accept for current phase; add server ledger only if needed.                                |
| Best-effort storage cleanup may miss future provider keys      | Medium   | Re-test after PostHog SDK upgrades.                                                        |
