# Telemetry Minimization

Status: Privacy Plan - analytics and profiling baseline.
Date: 2026-05-14

This document defines StageLink's minimum viable telemetry posture. The goal is
to keep analytics useful without collecting invasive behavioral data.

## Minimization Principles

- Track events, not people, unless there is a clear product need.
- Use aggregate artist metrics for dashboards.
- Keep provider event payloads typed and small.
- Do not send emails, full names, tokens, payment data, message bodies, full
  URLs, or raw IPs to analytics providers.
- Do not enable autocapture, session replay, heatmaps, fingerprinting,
  advertising pixels, or cross-device stitching without a separate privacy
  review.
- Prefer domain-level referrer/destination data over full URLs.
- Prefer field names over field values for product edit events.

## Minimum Viable Telemetry

### Public Analytics

Keep:

- page view count;
- link click count;
- smart-link resolution count;
- fan capture submit count;
- timestamps rounded/aggregated in dashboards;
- block/link IDs needed for artist-owned dashboard aggregation;
- quality flags for bot, QA, internal, environment, consent state.

Avoid:

- full visitor URL paths beyond the public page context;
- full referrer URLs;
- destination URLs in provider analytics;
- visitor email or subscriber identity;
- precise geolocation;
- browser fingerprinting attributes;
- per-visitor journey views exposed to artists.

### Product Analytics

Keep:

- onboarding completed;
- profile updated field names;
- block lifecycle events;
- actor user ID and artist ID only where needed.

Avoid:

- profile content values;
- bio, EPK, rider, contact, or message body text;
- billing/payment details;
- provider tokens;
- precise admin/support behavior unless required for audit/security.

### StageLink Insights

Keep:

- provider account reference selected by artist;
- public provider metrics needed for the dashboard;
- snapshot timestamp;
- top content metadata needed for the UI.

Avoid:

- private OAuth scopes unless separately reviewed;
- listener-level or fan-level data;
- derived scores that rank or judge artists without transparency;
- long-term snapshots beyond a defined retention period.

## Metadata Reduction Rules

| Data type       | Rule                                                                                                              |
| --------------- | ----------------------------------------------------------------------------------------------------------------- |
| URL             | Send/store domain or internal ID where possible, not full URL.                                                    |
| IP address      | Do not store raw IP in analytics; use hashed or provider-side disabled IP where possible.                         |
| Email/name      | Do not send to PostHog/Umami/product analytics. Store only where feature requires it, such as subscriber capture. |
| Free text       | Never analytics payload. Use field names only.                                                                    |
| Token/secret    | Never analytics, logs, audit metadata, or provider payload.                                                       |
| Device/platform | Coarse category only; no fingerprinting.                                                                          |
| Location        | Avoid precise location; country-level only if needed and lawful.                                                  |

## Retention Minimization

Current state:

- analytics raw event retention is not destructively enforced;
- retention candidate reporting exists for privacy lifecycle work;
- PostHog/provider retention is not captured in evidence yet.

Required before public scale:

- set raw `analytics_events` retention period;
- define retention for StageLink Insights snapshots;
- configure PostHog retention and region;
- decide whether bot/QA/internal events need shorter retention;
- implement deletion/anonymization jobs only after dry-run evidence and backup
  policy are ready.

Recommended baseline:

- public raw analytics: 13-24 months, then aggregate/anonymize or delete;
- bot/QA/internal analytics: 30-90 days unless needed for debugging;
- product analytics in PostHog: shortest provider retention that supports
  product learning;
- insights snapshots: retain rolling history needed for visible charts, not
  indefinite raw snapshots.

## Event Removal / No-Go List

Do not add:

- page scroll depth per visitor;
- cursor movement;
- heatmaps;
- session replay;
- full clickstream across authenticated app;
- cross-device identity stitching;
- marketing/ad pixels;
- automatic contact import tracking;
- inferred fan identity or fan scoring;
- sensitive category inference from music taste, location, or audience.

## Current Strengths

- PostHog browser autocapture disabled.
- PostHog browser pageview auto-capture disabled.
- Public PostHog and local public events are consent-gated.
- Public link tracking strips destination URL down to domain for PostHog.
- Local analytics store raw IP hash, not raw IP.
- Fan insights expose aggregate capture rate, not subscriber emails.

## Current Gaps

- Deterministic unsalted IP hash may allow repeat-visitor inference.
- Product analytics events with actor user ID need final lawful-basis/opt-out
  posture.
- Raw event retention is not enforced.
- PostHog project settings must be verified so provider-side autocapture/replay
  cannot surprise the code posture.
