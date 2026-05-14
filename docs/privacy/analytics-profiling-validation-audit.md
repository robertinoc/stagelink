# Analytics and Profiling Validation Audit

Status: validation audit for Privacy Plan analytics/profiling work.
Date: 2026-05-14

Scope reviewed:

- `apps/web/src/lib/analytics/*`
- `apps/api/src/modules/analytics/*`
- `apps/api/src/modules/public/*`
- `apps/api/src/modules/smart-links/*`
- `apps/api/src/modules/insights/*`
- `packages/types/src/analytics.ts`
- `docs/privacy/analytics-inventory.md`
- `docs/privacy/profiling-analysis.md`
- `docs/privacy/analytics-consent.md`
- `docs/privacy/telemetry-minimization.md`
- `docs/privacy/anonymization-strategy.md`
- `docs/privacy/analytics-optout.md`
- `docs/privacy/provider-analytics-review.md`
- existing consent, tracking, retention, incident, third-party, and transfer
  privacy docs

This is not legal advice. It is a critical privacy engineering audit of
StageLink analytics and profiling readiness.

## 1. Analytics Inventory Audit

Result: strong current coverage.

Confirmed:

- PostHog browser and server usage identified;
- local PostgreSQL public analytics identified;
- StageLink Insights data identified;
- consent cookies and PostHog storage identified;
- Umami appears inactive in source;
- operational/security telemetry is separated from optional analytics.

Gap:

- provider-side PostHog project settings still require console evidence;
- product analytics lawful basis/opt-out is not fully resolved.

Severity: High before public scale.

## 2. Profiling Audit

Result: realistic and appropriately cautious.

Confirmed:

- no active Article 22 automated decision-making found;
- public visitor engagement analytics is behavioral and consent-gated;
- artist performance dashboards are profiling-adjacent but not individual
  visitor profiling;
- StageLink Insights is high-risk cross-platform artist performance profiling.

Gap:

- future AI recommendations, artist ranking, segmentation, or marketing pixels
  would require new review.

Severity: Medium.

## 3. Analytics Sensitivity Audit

Result: improved classification.

Strong points:

- deterministic IP hash is correctly treated as pseudonymous;
- subscriber email data is separated from analytics events;
- StageLink Insights is treated as identifiable artist/account data;
- product analytics actor IDs are flagged.

Risk:

- low-volume aggregates and stable IP hashes can still support
  re-identification if expanded.

Severity: Medium.

## 4. Telemetry Minimization Audit

Result: good current code posture.

Strong points:

- no PostHog autocapture;
- no PostHog browser auto pageviews;
- destination/referrer domains preferred over full URLs;
- field names sent instead of profile/block content values;
- public analytics blocked before consent.

Gaps:

- `analytics_events` raw retention is not enforced;
- product analytics still sends actor user IDs to PostHog;
- `block.update` audit metadata stores DTO in audit logs, requiring audit log
  schema discipline even if not sent to PostHog.

Severity: Medium.

## 5. Anonymization Audit

Result: honest pseudonymization, not overclaimed anonymity.

Strong points:

- docs avoid saying analytics is fully anonymous;
- raw IP is not persisted locally;
- PostHog browser uses `ip:false`;
- dashboards expose aggregates.

Gaps:

- unsalted SHA-256 IP hash is stable across time;
- no aggregation/anonymization job exists after raw retention period;
- future geography/device/referrer dimensions need thresholds.

Severity: High before large-scale public analytics.

## 6. Analytics Consent Audit

Result: strong for public/visitor analytics.

Strong points:

- no valid consent means analytics disabled;
- PostHog initializes only after analytics consent;
- public page/link/smart-link/fan-capture analytics persistence is blocked
  before consent;
- withdrawal resets/opts out PostHog browser best effort.

Gaps:

- authenticated product analytics is not governed by the same consent UI;
- consent record is browser-local, not account-wide;
- no server-side consent ledger.

Severity: High for product analytics policy, Low/Medium for public analytics.

## 7. Analytics Opt-Out Audit

Result: good visitor opt-out, incomplete account-level product opt-out.

Strong points:

- persistent and reversible browser preference;
- non-essential analytics can be rejected;
- public pages still work after opt-out.

Gap:

- no authenticated user product analytics opt-out or objection workflow.

Severity: High before public scale.

## 8. Third-Party Analytics Exposure Audit

Result: good code controls, provider evidence incomplete.

Strong points:

- PostHog code disables risky browser defaults;
- Umami inactive;
- provider expansion triggers are documented.

Gaps:

- PostHog project retention/region/autocapture/session replay/person-profile
  settings need evidence;
- no provider-side deletion runbook implemented yet.

Severity: High.

## 9. Public Analytics Exposure Audit

Result: acceptable current dashboard posture.

Strong points:

- analytics endpoints require artist membership;
- dashboards aggregate data;
- fan insights do not include subscriber emails;
- plan-gated advanced analytics limits exposure.

Gaps:

- cross-tenant analytics remains a Critical class if future endpoints bypass
  ownership guards;
- low-volume breakdowns need thresholds if added.

Severity: Medium.

## 10. GDPR Profiling Compliance Audit

Result: no current Article 22 blocker, but enhanced transparency needed.

Findings:

- Article 22 automated decision-making does not appear active.
- Profiling transparency should cover public engagement analytics, product
  analytics, and cross-platform insights.
- Opt-out/objection posture for authenticated product analytics must be
  finalized.

Severity: Medium to High depending public launch posture.

## Risk Assessment

### Critical

- None confirmed in current analytics implementation.

### High

- Authenticated PostHog product analytics uses actor user IDs without final
  account-level opt-out/lawful-basis posture.
- PostHog provider settings, retention, and region are not evidenced.
- Raw analytics retention/anonymization is not enforced.
- Stable unsalted IP hash can support repeat-visitor inference over long
  retention.
- StageLink Insights creates cross-platform artist performance profiles that
  need clear disclosure and retention/disconnect rules.

### Medium

- Low-volume dashboards can reveal individual behavior if future breakdowns are
  too granular.
- Consent is browser-local, not account-wide.
- Product analytics and audit metadata require continued schema discipline.
- Provider-side deletion for PostHog and imported insights is manual.

### Low

- Umami inactive.
- No session replay, heatmaps, autocapture, fingerprinting, or Article 22
  automated decisions found.

## Analytics Privacy Readiness Score

Overall score: 81/100.

| Category                       | Score | Notes                                      |
| ------------------------------ | ----: | ------------------------------------------ |
| Analytics inventory            |    88 | Good source/code coverage                  |
| Public analytics consent       |    90 | Strong opt-in behavior                     |
| Telemetry minimization         |    84 | Good payload controls                      |
| Anonymization/pseudonymization |    72 | Honest model, IP hash/retention gaps       |
| Product analytics governance   |    64 | Actor-ID PostHog events need final posture |
| Profiling transparency         |    78 | Strong analysis, policy updates needed     |
| Provider analytics risk        |    70 | PostHog evidence incomplete                |
| Public analytics isolation     |    84 | Aggregated and guarded                     |
| Operational readiness          |    78 | Docs strong, jobs/runbooks pending         |

## Production Blockers

These block "analytics/profiling privacy complete" for public scale, not private
QA:

1. Finalize authenticated product analytics lawful basis and opt-out/objection
   posture.
2. Confirm PostHog project region, retention, autocapture, session replay,
   person-profile, IP handling, and data export settings.
3. Define and implement raw analytics retention/anonymization.
4. Decide whether to replace deterministic unsalted IP hash with HMAC/rotating
   hash.
5. Add clear public-policy/dashboard transparency for StageLink Insights and
   artist performance profiling.
6. Add provider-side deletion runbooks for PostHog and imported insights data.

## Recommendations

Immediate:

- Adopt the analytics matrix and profiling analysis as the current baseline.
- Keep PostHog autocapture/session replay/heatmaps disabled.
- Keep Umami disabled until consent-gated and documented.
- Add review rule: no direct `posthog-js` imports outside analytics helpers.

Before public launch:

- Complete PostHog evidence register.
- Add product analytics preference or documented objection workflow.
- Define raw analytics retention job.
- Add public policy wording for profiling-adjacent analytics and StageLink
  Insights.
- Add threshold rules before country/device/referrer breakdowns.

Future:

- self-hosted or EU-hosted analytics evaluation;
- HMAC/rotating visitor hash;
- aggregate tables after raw event deletion;
- privacy-preserving telemetry experiments only when product scale justifies
  them;
- differential privacy only if StageLink introduces broad benchmarking or
  cohort comparisons.
