# Profiling Analysis

Status: Privacy Plan - analytics and profiling baseline.
Date: 2026-05-14

This document evaluates whether StageLink analytics creates GDPR profiling or
automated decision-making concerns. It is not legal advice.

## GDPR Baseline

GDPR defines profiling broadly as automated processing of personal data to
evaluate personal aspects of a person, including behavior, preferences,
interests, performance, location, or movements.

StageLink should treat some analytics as profiling-adjacent even when the main
output is aggregate artist metrics. Anonymization should not be assumed merely
because raw IPs are not stored.

## Profiling Activity Matrix

| Activity                            | Purpose                                                                       | User impact                                                                                   | GDPR implication                                                               | Transparency requirement                                                              | Risk               |
| ----------------------------------- | ----------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------- | ------------------ |
| Public visitor engagement analytics | Show artists page views, clicks, CTR, smart-link usage, and fan captures      | Visitors are not individually shown to artists, but behavior contributes to artist dashboards | Pseudonymous/aggregate behavioral analytics after consent                      | Cookie/privacy policy must explain public-page analytics and artist-facing aggregates | Medium             |
| Artist product usage analytics      | Understand onboarding, profile edits, block lifecycle, feature adoption       | StageLink can analyze artist-user behavior and funnels                                        | Behavioral product analytics; no current automated legal/significant decisions | Privacy policy should disclose product analytics and opt-out/consent posture          | High               |
| Artist performance analytics        | Show traffic/link/capture trends to artist/team                               | Artist sees performance and fan engagement signals                                            | Performance profiling of artist page/content, mostly business-facing           | Dashboard and policy should explain metrics are estimates and filtered                | Medium             |
| Cross-platform StageLink Insights   | Aggregate Spotify/YouTube/SoundCloud public metrics and top content snapshots | Artist receives combined performance view across providers                                    | Cross-platform profiling of artist public presence and content performance     | Must disclose provider data sources, purpose, retention, disconnect/delete behavior   | High               |
| Fan capture rate                    | Calculate conversion ratio from page views to fan captures                    | Artist sees aggregate conversion of visitors to subscribers                                   | Engagement/conversion profiling, no individual fan scoring                     | Explain aggregate fan insights and do not expose subscriber-level analytics           | High               |
| Bot/QA/internal filtering           | Exclude low-quality traffic from artist dashboards                            | Reduces inaccurate metrics                                                                    | Automated quality classification, but not a person-impacting decision          | Explain data quality filters in analytics docs/UI notes                               | Low                |
| Plan-gated analytics views          | FREE/PRO/PRO+ feature access for longer ranges and advanced insights          | Product entitlement affects what artist can view                                              | Not profiling; contractual entitlement logic                                   | Pricing/product transparency                                                          | Low                |
| Recommendations/automated inference | No active recommendation or automated ranking found                           | None currently                                                                                | Article 22 not triggered by current repo state                                 | Future features need separate review                                                  | Future             |
| Admin/internal analytics            | Potential future internal review of usage/security patterns                   | Could affect support/risk decisions if used that way                                          | Could become profiling if used for fraud/risk scoring                          | Need separate policy if used beyond security/operations                               | Medium future risk |

## Article 22 Assessment

Current conclusion: no active Article 22 automated decision-making was found.

Reasons:

- analytics dashboards do not make automated legal or similarly significant
  decisions about users;
- plan-gated features are based on subscription entitlement, not inferred
  behavior;
- bot/QA filtering affects aggregate metrics, not access to service;
- no recommendation engine, automated risk scoring, artist ranking, or
  automated user suspension logic was found.

Article 22 risk would increase if StageLink introduces:

- automated account suspension based on analytics/security scores;
- automated pricing/plan recommendations with significant effects;
- artist ranking, discoverability boosts, or audience scoring from engagement;
- AI-generated career or booking recommendations based on cross-platform
  metrics;
- automated fraud/risk decisions that materially affect accounts.

## Transparency Requirements

StageLink public/privacy documentation should explain:

- public-page analytics are optional and consent-gated;
- analytics may include page views, link clicks, smart-link routing, fan capture
  events, device/platform hints, referrer domains, and timestamps;
- raw IP is not stored, but pseudonymous hashes and event metadata can still be
  personal data;
- artists see aggregate metrics, not individual visitor identities;
- StageLink may use product analytics to improve onboarding and features;
- StageLink Insights combines provider data from Spotify, YouTube, and
  SoundCloud when artists configure it;
- users can withdraw analytics consent and disable non-essential analytics.

## Profiling Opt-Out

Current opt-out:

- visitor analytics opt-out through consent banner/preferences;
- PostHog browser opt-out/reset and storage cleanup;
- public analytics persistence blocked before consent and after withdrawal.

Needed before public scale:

- clear product/account setting for authenticated artist product analytics
  preferences, or a documented lawful-basis/objection workflow;
- provider-side deletion/retention runbook for PostHog and insights snapshots;
- statement that opt-out does not disable necessary security, billing,
  authentication, or operational logs.

## Risk Notes

### High

- Authenticated product analytics uses user IDs and is not currently governed by
  the same cookie consent gate as visitor analytics.
- Cross-platform insights can create a rich artist performance profile.
- Fan capture analytics can become sensitive if combined with subscriber emails
  or campaign data.

### Medium

- Unsalted deterministic IP hashes can support repeated-visitor inference if
  used beyond aggregate analytics.
- Top links and capture blocks can reveal business strategy to team members;
  access must remain tenant-scoped.
- PostHog configuration evidence is incomplete.

### Low

- No active Article 22 automated decision-making found.
- PostHog autocapture and pageview auto-capture are disabled in code.

## Future Review Triggers

Run a new profiling review before adding:

- recommendations;
- AI insights;
- artist scoring/ranking;
- marketing segmentation;
- user risk/fraud scoring;
- session replay/autocapture;
- advertising pixels;
- cross-device identity stitching;
- provider OAuth with private user data;
- export of analytics to sales/support tools.

## Sources Used

- GDPR Regulation (EU) 2016/679, Article 4 profiling definition and Article 22:
  https://eur-lex.europa.eu/eli/reg/2016/679/oj
- Article 29 Working Party / EDPB-endorsed Guidelines on automated individual
  decision-making and profiling:
  https://ec.europa.eu/newsroom/article29/items/612053
