# Analytics Anonymization Strategy

Status: Privacy Plan - analytics and profiling baseline.
Date: 2026-05-14

This document separates anonymization from pseudonymization. StageLink should
not claim analytics data is anonymous merely because raw IP addresses are not
stored.

## Current State

| Data set                  | Current protection                               | Classification                                               |
| ------------------------- | ------------------------------------------------ | ------------------------------------------------------------ |
| Public analytics IP       | SHA-256 hash of IP; raw IP not persisted         | Pseudonymous                                                 |
| PostHog browser analytics | `ip:false`, consent-gated, autocapture off       | Pseudonymous provider analytics                              |
| Public dashboard metrics  | Aggregated counts/time series/top links          | Aggregated; source remains pseudonymous                      |
| Fan capture analytics     | Event count separate from subscriber email table | Pseudonymous event, identifiable subscriber record elsewhere |
| Product analytics         | Actor user ID and artist ID in PostHog           | Identifiable/pseudonymous                                    |
| StageLink Insights        | External artist/account IDs and public metrics   | Identifiable artist performance data                         |
| Audit/security logs       | IDs, paths, status, optional IP/security context | Pseudonymous/identifiable depending event                    |

## Strategy by Analytics Category

### Public Traffic Analytics

Current:

- no raw IP stored in `analytics_events`;
- deterministic SHA-256 IP hash supports deduplication/future unique counts;
- dashboard queries aggregate by artist/date/link/block.

Required controls:

- do not expose visitor-level event rows to artists;
- do not use IP hash for individual visitor journeys;
- do not join IP hash with subscriber email unless needed for security/abuse;
- define retention and eventual deletion/anonymization.

Recommended improvement:

- replace plain SHA-256 IP hash with keyed HMAC or rotating salt for future
  deduplication windows.
- consider daily/monthly rotating hash for unique counts so long-term visitor
  linking is harder.

### Product Usage Analytics

Current:

- PostHog server events use `user.id` as distinct ID for authenticated product
  actions;
- `$process_person_profiles:false` is set in server capture properties.

Required controls:

- keep event payloads to IDs and field names;
- do not send profile content, emails, names, free text, or billing details;
- document lawful basis and objection/opt-out posture;
- confirm PostHog project retention and person-profile settings.

Recommended improvement:

- use a scoped pseudonymous analytics ID if product analytics does not need raw
  internal user ID in PostHog.

### Artist Dashboard Aggregates

Current:

- dashboards return aggregated counts, rates, top links, top capture blocks,
  and trend series;
- membership guard restricts access to the owning artist/team.

Required controls:

- enforce tenant isolation on every analytics endpoint;
- keep minimum aggregation thresholds if StageLink later shows geography,
  device, referrer, or audience segment breakdowns;
- avoid "individual visitor" drilldowns.

### StageLink Insights

Current:

- snapshots store provider profile, metrics, top content, and notes.

Required controls:

- treat as artist-identifiable performance data;
- do not call it anonymous;
- define snapshot retention;
- provide disconnect/delete behavior for local imported data;
- do not add private OAuth scopes without separate review.

## Aggregation Requirements

Current safe aggregates:

- total page views;
- total link clicks;
- CTR;
- smart-link resolutions;
- fan capture rate;
- trend points by day;
- top links/blocks.

Additional aggregate controls before adding new dimensions:

- country/device/referrer breakdowns should use minimum thresholds;
- avoid showing very granular combinations that can identify a single visitor;
- avoid exact timestamps in artist dashboards;
- round or bucket low-volume segments where practical.

## IP and Device Handling

Rules:

- never persist raw IP in analytics tables;
- avoid precise geolocation;
- use coarse device/platform categories only;
- do not create browser fingerprints;
- do not combine UA, IP hash, locale, platform, and referrer into visitor-level
  profiles.

## Anonymization Claims

Allowed language:

- "we minimize analytics data";
- "we do not store raw IP addresses in local analytics events";
- "we use pseudonymous or aggregated analytics where possible";
- "artists see aggregate metrics rather than individual visitor identities."

Avoid:

- "analytics is anonymous" for raw event tables;
- "IP hashing makes data non-personal";
- "PostHog data is anonymous";
- "aggregated dashboards mean no GDPR applies."

## Re-Identification Risks

| Risk                                                             | Severity | Mitigation                                                                           |
| ---------------------------------------------------------------- | -------- | ------------------------------------------------------------------------------------ |
| Stable unsalted IP hash reused over long retention               | High     | Use keyed/rotating hash or delete raw events after retention period.                 |
| Low-volume analytics segments reveal individual visitor behavior | Medium   | Add thresholds before country/device/referrer breakdowns.                            |
| Product analytics actor user ID in PostHog                       | High     | Minimize payloads, confirm lawful basis/opt-out, consider pseudonymous analytics ID. |
| Combining fan capture emails with analytics events               | High     | Keep subscriber records separate from analytics dashboards.                          |
| Cross-platform insights identify artist performance profile      | High     | Disclose clearly and support disconnect/delete.                                      |

## Future TODOs

- HMAC/rotating IP hash strategy.
- Retention job for raw analytics events.
- Aggregate tables for long-term analytics after raw deletion.
- Thresholding for future geography/device/referrer breakdowns.
- Privacy-preserving analytics exploration, such as self-hosted EU analytics or
  differential privacy only if scale warrants it.
