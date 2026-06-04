# Analytics Inventory

Status: Privacy Plan - analytics and profiling baseline.
Date: 2026-05-14

This inventory covers StageLink analytics, telemetry, profiling-adjacent data,
browser identifiers, provider exposure, and consent requirements. It reflects
the current repository state and should be updated whenever a new event,
provider, cookie, dashboard metric, insight, or tracking purpose is added.

## Executive Summary

StageLink currently has four analytics layers:

1. StageLink local public analytics in PostgreSQL (`analytics_events`).
2. PostHog product/public analytics, consent-gated for browser/public traffic.
3. StageLink Insights snapshots from Spotify, YouTube, and SoundCloud.
4. Operational/audit/security telemetry for debugging, abuse prevention, and
   incident response.

Umami is now supported as an optional StageLink Platform analytics layer. It
stays inactive unless `NEXT_PUBLIC_UMAMI_PLATFORM_WEBSITE_ID` is configured, and
it is mounted only in platform route groups/pages so Behind can remain a viewer
rather than a tracked surface.

## Analytics Data Matrix

| Category                            | Data collected                                                                                                                         | Purpose                                                  | Provider/storage                                                    | Consent requirement                                                                                                                                     | Retention                                                | Anonymization level                                                    | Profiling implications                                                                  | Risk   |
| ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- | ---------------------------------------------------------------------- | --------------------------------------------------------------------------------------- | ------ |
| Public page views                   | `artistId`, event type `page_view`, SHA-256 IP hash, quality flags, timestamp                                                          | Artist traffic analytics and dashboard metrics           | PostgreSQL `analytics_events`; optional PostHog event after consent | Analytics consent required for persistence/emission                                                                                                     | Not destructively enforced yet; retention policy pending | Pseudonymous; no raw IP, but stable unsalted hash                      | Engagement profiling of artist audience in aggregate                                    | Medium |
| Public link clicks                  | `artistId`, `blockId`, `linkItemId`, label, smart-link flag/id, SHA-256 IP hash, timestamp                                             | Link performance, CTR, top links                         | PostgreSQL; browser PostHog after consent                           | Analytics consent required                                                                                                                              | Not destructively enforced yet                           | Pseudonymous; destination domain only in PostHog                       | Behavioral/engagement analytics at artist/link level                                    | Medium |
| Smart link resolution               | `artistId`, smart-link id, platform detected/resolved, fallback flag, SHA-256 IP hash                                                  | Platform routing analytics and smart-link performance    | PostgreSQL; server PostHog after consent                            | Analytics consent required                                                                                                                              | Not destructively enforced yet                           | Pseudonymous; platform is coarse device/routing inference              | Device/platform behavior profile in aggregate                                           | Medium |
| Fan capture submit analytics        | `artistId`, block id, event type, SHA-256 IP hash, quality flags                                                                       | Capture rate and fan-insight metrics                     | PostgreSQL; server PostHog after consent                            | Analytics event requires analytics consent; subscriber creation follows form consent rules                                                              | Not destructively enforced yet                           | Pseudonymous analytics event; subscriber table stores email separately | Conversion profiling by artist/block                                                    | High   |
| Subscriber records                  | Email, consent flag/text, optional IP hash, artist/block/page IDs                                                                      | Email capture requested by artist and fan                | PostgreSQL `subscribers`                                            | Form consent when block requires it; not analytics consent                                                                                              | Subscriber retention/deletion policy pending             | Identifiable                                                           | Not analytics by itself, but can be joined conceptually with capture metrics if misused | High   |
| Dashboard/product events            | Onboarding complete, artist profile updated, block lifecycle events with actor user ID, artist ID, block/page IDs, updated field names | Product usage analytics and onboarding funnel            | PostHog server-side when `POSTHOG_KEY` configured                   | Currently not controlled by visitor cookie consent; should be treated as product analytics requiring policy basis and opt-out strategy                  | PostHog retention not confirmed                          | Identifiable/pseudonymous actor IDs                                    | Behavioral profiling of artist product usage                                            | High   |
| Artist analytics dashboards         | Aggregated page views, clicks, CTR, smart-link performance, fan capture rate, trend series, top links/blocks                           | Artist-facing performance analytics                      | StageLink API/dashboard from PostgreSQL                             | User is authenticated artist/team member; source events require visitor analytics consent                                                               | Based on raw event retention                             | Aggregated at artist/resource level                                    | Artist performance profiling and business insights                                      | Medium |
| StageLink Insights                  | External account IDs/handles/URLs, display name, public metrics, top content snapshots from Spotify/YouTube/SoundCloud                 | Cross-platform artist performance dashboard              | PostgreSQL `artist_platform_insights_*`; external APIs              | Artist config/connection; provider terms and policy disclosures required                                                                                | Snapshot retention not finalized                         | Identifiable artist/account data and aggregated public metrics         | Cross-platform artist performance profiling                                             | High   |
| Operational analytics/security logs | `security_event`, request ID, status/path, rate-limit events, audit logs                                                               | Security, abuse prevention, debugging, incident response | Railway/Vercel logs, PostgreSQL `audit_logs`, provider consoles     | Necessary/legitimate interests; not optional analytics                                                                                                  | Runtime/provider retention not finalized                 | Pseudonymous/internal IDs; can include IP if needed                    | Not product profiling; can reveal behavior if over-collected                            | Medium |
| QA/internal flags                   | `sl_qa`, `isQa`, `isInternal`, environment quality flags                                                                               | Exclude QA/internal traffic from metrics                 | Cookies/headers and `analytics_events` flags                        | Necessary for QA/data quality when used intentionally                                                                                                   | Same as analytics events                                 | Pseudonymous flagging                                                  | No user profiling; internal data-quality control                                        | Low    |
| PostHog browser identifiers         | PostHog localStorage/cookies after consent                                                                                             | Product/public analytics event delivery                  | PostHog browser SDK                                                 | Analytics consent required                                                                                                                              | PostHog retention not confirmed                          | Pseudonymous provider identifier                                       | Behavioral tracking if expanded                                                         | High   |
| Umami                               | StageLink platform page views/referrers, signup/login intent events, confirmed signup conversion, UTM campaign parameters              | Product and growth analytics for StageLink Platform      | Umami Cloud or self-hosted Umami via `NEXT_PUBLIC_UMAMI_*` env vars | Analytics consent required before loading the browser script or creating the temporary signup marker; not loaded on Behind or public artist pages in v1 | Configured in Umami                                      | Aggregated/pseudonymous provider data                                  | Product behavior and acquisition analytics                                              | Medium |

## Active Event Catalog

### Umami StageLink Platform Events

Current explicit events:

- `auth_signup_started`
- `auth_signup_completed`
- `auth_signup_login_clicked`
- `auth_login_started`
- `auth_login_signup_clicked`

Controls:

- loaded inside platform route groups/pages;
- not mounted inside `apps/web/src/app/behind/layout.tsx`;
- `data-do-not-track="true"`;
- configured by `NEXT_PUBLIC_UMAMI_PLATFORM_WEBSITE_ID`;
- gated by the StageLink analytics consent cookie;
- signup conversion uses a timestamp-only `sessionStorage` marker with a
  one-hour maximum age and removes it after conversion, mismatch, expiry, or
  consent withdrawal;
- `/behind/analytics` embeds the shared StageLink Platform Umami dashboard;
- event properties must avoid end-user PII and should describe product context
  only;
- public artist pages remain out of scope for this Umami website in v1.

### Local PostgreSQL `analytics_events`

Event types:

- `page_view`
- `link_click`
- `smart_link_resolution`
- `fan_capture_submit`

Stored fields:

- `artistId`
- optional `blockId`
- `eventType`
- `ipHash`
- optional `country`, `device`
- optional `linkItemId`, `label`, `isSmartLink`, `smartLinkId`
- `createdAt`
- `isBotSuspected`, `isInternal`, `isQa`, `hasTrackingConsent`, `environment`

Privacy notes:

- Raw IP is not stored.
- `ipHash` uses deterministic SHA-256 of IP and is therefore pseudonymous, not
  truly anonymous.
- `country` and `device` exist in schema but are not reliably populated in the
  current flow.
- Local events are now persisted only when analytics consent resolves true.
- Raw event cleanup is not yet destructively enforced.

### PostHog Browser Events

Current browser event:

- `public_link_clicked`

Controls:

- initialized only after `sl_consent.categories.analytics === true`;
- `ip:false`;
- `capture_pageview:false`;
- `respect_dnt:true`;
- `autocapture:false`;
- known PostHog storage keys are removed on withdrawal best effort.

### PostHog Server Events

Current server-side events:

- `public_page_viewed`
- `smart_link_resolved`
- `fan_capture_submitted`
- `onboarding_completed`
- `artist_profile_updated`
- `block_created`
- `block_updated`
- `block_deleted`
- `block_published`
- `block_unpublished`

Controls:

- public/visitor server events are gated by analytics consent and quality flags;
- authenticated dashboard/product events use actor user ID and are not currently
  tied to cookie consent;
- `$process_person_profiles:false` is set by default in `PostHogService`;
- event properties are typed in `packages/types/src/analytics.ts`.

Risk:

- authenticated product events can still create behavioral records about artist
  users in PostHog even when person-profile processing is disabled.
- `block.update` audit metadata stores the DTO in `audit_logs`; PostHog event
  sends only field names.

## Browser Storage and Identifiers

| Mechanism                                   | Purpose                           | Consent posture                   | Risk                                   |
| ------------------------------------------- | --------------------------------- | --------------------------------- | -------------------------------------- |
| `sl_consent`                                | canonical consent record          | necessary for consent enforcement | Low                                    |
| `sl_ac`                                     | compact analytics consent header  | necessary for consent enforcement | Low                                    |
| PostHog cookies/localStorage/sessionStorage | analytics identifier after opt-in | analytics consent required        | High if expanded to autocapture/replay |
| Umami script/runtime storage                | StageLink Platform analytics      | analytics consent required        | Medium                                 |
| `sl_qa`                                     | QA traffic exclusion              | internal testing only             | Low                                    |
| WorkOS cookies                              | authentication/session/PKCE       | necessary                         | High if leaked, but not analytics      |
| `NEXT_LOCALE`                               | localization                      | necessary/preference              | Low                                    |

## Public/Private Visibility

- Artist dashboard analytics are private and guarded by artist membership.
- Public pages load without analytics consent.
- Public page analytics must never expose visitor-level records to artists.
- Dashboard output should remain aggregated counts, top links, rates, and time
  series.
- Cross-tenant analytics access remains a Critical privacy/security risk if any
  endpoint fails ownership checks.

## Consent Requirement Summary

| Flow                             | Before analytics consent                     | After analytics consent                                 |
| -------------------------------- | -------------------------------------------- | ------------------------------------------------------- |
| Public page content              | Allowed                                      | Allowed                                                 |
| Public page view local event     | Blocked                                      | Allowed                                                 |
| Public page view PostHog event   | Blocked                                      | Allowed                                                 |
| Umami StageLink Platform events  | Blocked                                      | Allowed on platform routes when env vars are configured |
| Public link click local event    | Blocked                                      | Allowed                                                 |
| Public link click PostHog event  | Blocked                                      | Allowed                                                 |
| Smart link redirect              | Allowed                                      | Allowed                                                 |
| Smart link analytics             | Blocked                                      | Allowed                                                 |
| Fan capture form submit          | Allowed when form rules pass                 | Allowed when form rules pass                            |
| Fan capture analytics event      | Blocked                                      | Allowed                                                 |
| Auth/session/security logs       | Allowed as necessary/security                | Allowed as necessary/security                           |
| Dashboard product PostHog events | Currently allowed when server key configured | Currently allowed when server key configured            |

## Inventory Gaps

- PostHog project region, retention, IP handling, and autocapture/session replay
  settings must be confirmed in provider evidence.
- Umami provider retention, IP handling, and StageLink Platform domain settings must be
  confirmed in provider evidence before production dashboard sign-off.
- Product/dashboard event lawful basis and opt-out handling need final
  documented posture before public scale.
- Raw analytics retention/anonymization job remains backlog.
- Stable unsalted IP hash can support repeat-visitor inference if overused.
