# Audit 360 — S10 Observability & Analytics Audit

Date: 2026-06-02

Scope:

- T10.1 Audit Tracking Events
- T10.2 Audit Funnel Tracking
- T10.3 Audit Logs & Monitoring

## Executive Summary

S10 found that StageLink already has the right primitives: consent-gated PostHog on public pages,
Umami for product traffic, local analytics events for dashboard metrics, Sentry initialization, audit
logs for critical backend mutations, QA flags, and anti-bot filtering. The main gap was drift between
typed analytics events and the auth funnel events emitted from the web app. A second gap was that
the health endpoint did not expose whether observability providers were configured.

## Findings Implemented

### S10-001 — Auth Funnel Events Were Not in the Shared Event Catalog

Area: T10.1 Tracking Events, T10.2 Funnel Tracking

Login and signup intent events were emitted through `data-umami-event` attributes using
`platform_*` names, while the shared analytics catalog lived in `@stagelink/types`. That made the
auth funnel harder to audit, search, and keep aligned with PostHog/Umami naming.

Implemented:

- Added typed auth funnel events to `packages/types/src/analytics.ts`.
- Added `trackPlatformFunnelEvent()` in the web analytics helper.
- Updated login/signup CTAs and cross-links to emit typed, consent-gated events.
- Updated the Behind analytics panel to list the new `auth_*` event names.
- Added tests for login/signup event payloads and the helper's consent gate.

### S10-002 — Observability Provider Readiness Was Not Visible in Health

Area: T10.3 Logs & Monitoring

The API health endpoint reported basic runtime health, but not whether Sentry and PostHog were
configured. That makes deploy validation harder: the app can be healthy while error/event collection
is silently off.

Implemented:

- Added `observability.sentryConfigured` and `observability.posthogConfigured` booleans to
  `/health`.
- Kept the response safe: it exposes only configured/not-configured, never DSNs or keys.
- Added health controller test coverage.

## Audit Notes

### T10.1 Tracking Events

Public page events already flow through the typed analytics helper and local backend API with
consent/QA headers. The new auth funnel events close the most visible product-funnel drift between
the web UI and the shared event catalog.

### T10.2 Funnel Tracking

The signup/login funnel now has typed intent events:

- `auth_signup_started`
- `auth_signup_login_clicked`
- `auth_login_started`
- `auth_login_signup_clicked`

Onboarding completion was already captured server-side as `onboarding_completed`, with audit logging
and PostHog capture in `OnboardingService`.

### T10.3 Logs & Monitoring

Sentry remains inert unless configured, which is the right privacy-safe default. The health endpoint
now makes that configuration state observable during deploy checks.

## Remaining Observability Backlog

- Add route-level production smoke checks that assert Sentry/PostHog/Umami env readiness per
  deployment target.
- Add a lightweight backend metric for analytics ingestion failures and rejected consent/QA events.
- Add dashboard-level events for plan upgrade intent, billing portal open, and settings connection
  attempts after S1/S4 clarify the product narrative and performance budget.
- Consider structured logging for Next.js proxy routes to replace scattered `console.error` calls.
