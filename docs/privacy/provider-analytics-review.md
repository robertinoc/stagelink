# Provider Analytics Review

Status: Privacy Plan - analytics and profiling baseline.
Date: 2026-05-14

This document reviews third-party analytics exposure and provider-related
profiling risk.

## Provider Matrix

| Provider                   | Active use                                                                         | Data exposure                                                                              | Current controls                                                                                  | Risk   |
| -------------------------- | ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------- | ------ |
| PostHog browser            | Public link click event after analytics consent                                    | pseudonymous browser ID, event name, artist/page/link IDs, destination domain, environment | opt-in only, `ip:false`, `respect_dnt:true`, autocapture/pageview disabled, withdrawal cleanup    | High   |
| PostHog server             | Public events after consent; product events for onboarding/profile/block lifecycle | event name, artist ID, actor user ID for product events, field names, block/page IDs       | `$process_person_profiles:false`, typed payloads, no raw IP, no email/token/payment data intended | High   |
| Umami                      | Not active in source                                                               | None currently                                                                             | Launch rule: consent-gate before enabling                                                         | Future |
| Vercel/Railway logs        | Runtime/deploy logs and request errors                                             | request metadata, errors, request IDs, possible paths                                      | logging policy forbids query/token/body logging                                                   | Medium |
| WorkOS                     | Auth/security events                                                               | identity/session/security metadata                                                         | necessary auth/security provider                                                                  | Medium |
| Stripe                     | Billing events and provider-side payment analytics                                 | customer/payment/subscription metadata on Stripe side                                      | payment data handled by Stripe, not StageLink analytics                                           | Medium |
| Spotify/YouTube/SoundCloud | StageLink Insights provider APIs                                                   | public artist/channel/profile metrics and top content                                      | reference/API-key style flows; no user OAuth in current launch baseline                           | High   |
| GitHub Actions             | CI logs/artifacts                                                                  | test logs/screenshots if generated                                                         | artifact auth masking policy                                                                      | Medium |

## PostHog Configuration Requirements

Code controls are not enough. Before public scale, confirm in PostHog project:

- project region (EU/US);
- retention period;
- autocapture disabled;
- session replay disabled;
- heatmaps disabled;
- person profiles disabled or minimized as intended;
- IP collection disabled or masked as expected;
- no marketing/ad destinations enabled;
- no data export/sync to third-party tools without review;
- access restricted to need-to-know operators;
- DPA/SCC/transfer evidence recorded.

## Umami Requirements If Enabled

Before enabling Umami:

- document provider/self-hosted region;
- initialize only after analytics consent;
- disable or avoid fingerprinting-like visitor identifiers where possible;
- do not run PostHog and Umami duplicate tracking for the same purpose unless
  there is a clear need;
- update cookie policy, tracking inventory, and provider evidence register.

## Fingerprinting and Cross-Device Risk

Current code avoids explicit fingerprinting:

- no canvas/audio/browser fingerprinting found;
- no session replay found;
- no heatmap/autocapture in code;
- PostHog browser autocapture disabled;
- only coarse platform/device hints are used for smart-link routing and
  analytics.

Risks:

- deterministic IP hash plus user agent/platform/referrer can become a weak
  fingerprint if joined and retained too long;
- PostHog provider-side settings could add capture outside code posture;
- future marketing pixels or ad integrations could create cross-site tracking.

Rules:

- no fingerprinting without explicit legal/product review;
- no cross-device identity stitching without explicit review;
- no session replay/autocapture before a separate DPIA-like privacy review;
- no advertising pixels under the current analytics consent category.

## Provider-Side Deletion and DSAR

StageLink should maintain runbooks for:

- deleting or suppressing PostHog events for a user/artist where feasible;
- deleting local StageLink Insights connection/snapshot data on disconnect or
  erasure;
- documenting provider limitations where independent providers retain their own
  records;
- avoiding claims that StageLink can delete provider-side Spotify/YouTube/
  SoundCloud/Stripe/WorkOS records it does not control.

## Public Analytics Exposure

Artist-facing analytics should remain:

- authenticated;
- tenant-scoped;
- aggregated;
- plan-gated where applicable;
- free of visitor identity, raw IP, email, or subscriber list details.

High-risk future additions:

- country/device/referrer segment breakdowns without thresholds;
- individual visitor timelines;
- subscriber-level engagement scoring;
- benchmark/ranking against other artists;
- recommendations based on inferred audience quality.

## Provider Exposure Risk Analysis

### High

- PostHog receives product event data tied to actor user IDs.
- PostHog project settings and retention are not yet captured as evidence.
- StageLink Insights creates cross-platform artist performance profiles.

### Medium

- Vercel/Railway logs can become analytics-like if request data is overlogged.
- WorkOS/Stripe provider dashboards contain operational metadata.
- GitHub/Vercel artifacts can accidentally include analytics screenshots or
  private dashboard data.

### Low

- Umami is not active.
- Browser PostHog code disables autocapture and pageview auto-capture.
