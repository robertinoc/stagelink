# Audit 360 — S5 Architecture & Scalability

Date: 2026-06-02

Scope:

- T5.1 Audit Frontend Architecture
- T5.2 Audit Backend Architecture
- T5.3 Audit Database & Queries
- T5.4 Audit External Integrations
- T5.5 Audit Scalability Risks

## Executive Summary

S5 found that StageLink's current module boundaries are generally healthy: the frontend is split by
feature surfaces, the backend keeps product areas in Nest modules, and previous audit phases already
addressed several high-impact query, caching, image, and public-page risks.

The concrete architecture gap with the clearest production risk was external-provider request
handling. Shopify, Spotify, YouTube, and SoundCloud requests did not share the timeout baseline that
Printful had locally. Under provider latency or partial outage, those request paths could keep API
workers waiting longer than intended and make user-facing flows harder to reason about.

S5 introduces a shared backend external fetch helper with typed timeout errors and migrates the active
third-party provider paths onto the same 5s deadline policy.

## Findings Implemented

### S5-001 — External Integrations Needed a Shared Timeout Policy

Area: T5.2 Backend Architecture, T5.4 External Integrations, T5.5 Scalability Risks

Provider calls were implemented independently across modules:

- Shopify Storefront requests used raw `fetch`.
- Spotify insights and token requests used raw `fetch`.
- YouTube insights requests used raw `fetch`.
- SoundCloud API v2 requests used raw `fetch`.
- Printful already had a local `AbortController` timeout, but that logic was not reusable.

Implemented:

- Added `fetchWithTimeout` in `apps/api/src/common/utils/external-fetch.ts`.
- Added `ExternalRequestTimeoutError` and `isExternalRequestTimeout` so providers can convert
  timeout failures into clear `503` responses without conflating them with other network errors.
- Migrated Shopify Storefront, Printful, Spotify, YouTube, and SoundCloud requests to the shared
  helper.
- Preserved existing provider-specific response parsing, credential validation, and best-effort
  behavior for optional top-content fetches.
- Added unit coverage for successful fetches and timeout abort behavior.

## Audit Notes

### T5.1 Frontend Architecture

The web app is already organized around feature areas such as marketing, public artist pages,
analytics, billing, EPK, onboarding, settings, and shared components. Recent S1, S3, S4, S8, and S9
changes fit into those surfaces without needing a broad refactor.

The main frontend architecture backlog is consistency rather than structure: richer landing visuals,
dashboard screenshots, and public-page fixtures should be added through existing feature components
instead of one-off marketing-only implementations.

### T5.2 Backend Architecture

The backend module split is in workable shape for the current product scope. The most important
backend architecture improvement in S5 is moving external request timeout behavior into a shared
utility so future providers start from the same operational baseline.

### T5.3 Database & Queries

No new query change was required in S5. Earlier phases already addressed several data and performance
risks around plan behavior, analytics reads, and public surfaces. The next query work should be
driven by measured production hot paths rather than speculative broad rewrites.

### T5.4 External Integrations

Third-party integrations are now easier to audit because provider requests share a visible timeout
policy. This is especially important for insights and merch flows, where providers can be slow,
rate-limited, or partially unavailable without StageLink itself being down.

### T5.5 Scalability Risks

S5 reduces one worker-exhaustion risk by bounding active provider calls. Remaining scalability risks
are mostly product-growth questions: request-level rate limits, background sync, public-page cache
strategy, and CI artifacts for route/bundle regressions.

## Remaining Architecture & Scalability Backlog

- Move request rate limits that are currently process-local to a shared store when production traffic
  or horizontal scaling requires it.
- Queue scheduled insights or merch sync work outside request threads once provider sync volume grows.
- Revisit public-page ISR after page-view tracking can run client-side or in middleware without
  breaking analytics accuracy.
- Source public pricing from the billing catalog or Stripe metadata instead of static marketing copy.
- Add CI route and bundle artifact capture once the Turbopack analyzer output is stable enough to
  diff automatically.
