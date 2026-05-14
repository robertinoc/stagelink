# Privacy Review Process

Status: Privacy Plan - review process baseline.
Date: 2026-05-14

This process defines when StageLink must run privacy review and how to keep the
review small enough for a startup team.

## Review Goals

Privacy review should answer:

- What personal data changes?
- Why is it needed?
- Where does it go?
- Who can access it?
- How long is it kept?
- What user choice, notice, export, deletion, or opt-out is needed?
- What evidence will prove the control works?

## Review Types

| Review type                | Trigger                                                                                                                                             | Reviewer                                     | Output                                                |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------- | ----------------------------------------------------- |
| Lightweight feature review | Feature touches existing personal data in an already-documented way                                                                                 | Product Owner + Engineering Privacy Reviewer | ticket checklist, no doc update if no material change |
| Material privacy review    | New data category, provider, transfer, retention, consent, DSAR, auth, payment, analytics, profiling, or admin access path                          | Privacy Owner + Engineering Privacy Reviewer | updated docs and risk decision                        |
| Legal/privacy reassessment | New lawful basis, public policy claim, cross-border transfer issue, breach notification, child/minor scenario, AI/profiling with significant impact | Privacy Owner + counsel                      | counsel note or documented decision                   |
| Incident-driven review     | High/Critical incident or breach assessment                                                                                                         | Security/Incident Owner + Privacy Owner      | postmortem, control/doc updates                       |
| Periodic review            | monthly/quarterly/annual cadence                                                                                                                    | relevant owners                              | dated review note and updated risk backlog            |

## Required Review Triggers

Run privacy review before release when a change:

- adds a new integration, provider, SDK, webhook, pixel, embed, or API scope;
- adds or changes analytics events, PostHog/Umami config, session replay,
  autocapture, heatmaps, attribution, or marketing tracking;
- introduces AI, ranking, recommendations, segmentation, scoring, or profiling;
- changes authentication, WorkOS claims, session behavior, deletion
  verification, or admin access;
- changes payment/billing processing, Stripe metadata, tax/invoice behavior, or
  subscription retention;
- changes public profiles, EPK sharing, fan capture, subscriber export, or
  public/private visibility;
- adds data export, account deletion, retention cleanup, backups, or logging;
- stores new personal data in PostgreSQL, object storage, logs, provider
  systems, localStorage/sessionStorage/cookies, or analytics providers;
- changes international transfer posture or provider region.

## Review Flow

1. Product/engineering identifies the privacy trigger in the ticket or PR.
2. Engineering maps affected data fields, systems, providers, and logs.
3. Product defines user-facing purpose, notice, consent/opt-out, and settings.
4. Privacy Owner decides whether ROPA/docs/public policy need updates.
5. Engineering implements controls and tests.
6. Reviewer confirms evidence and open gaps.
7. Release proceeds only if Critical/High unresolved privacy blockers are
   accepted by the Privacy Owner or fixed.

## Documentation Update Rules

Update docs when a change affects:

- data inventory or category;
- data flow/storage/provider;
- legal basis;
- consent/opt-out;
- DSAR/export/deletion;
- retention/anonymization;
- security/privacy by design controls;
- incident playbooks/detection;
- analytics/profiling;
- ROPA.

Small UI-only changes do not need privacy docs unless they change user notice,
privacy settings, public visibility, or data collection.

## Review Cadence

| Area                    | Cadence                                      | Notes                                          |
| ----------------------- | -------------------------------------------- | ---------------------------------------------- |
| ROPA and data inventory | quarterly + material changes                 | keep ROPA aligned with schema/providers        |
| Consent/cookies         | quarterly + analytics SDK/provider changes   | repeat no-consent and withdrawal tests         |
| DSAR/deletion           | quarterly + endpoint/provider changes        | run test export/delete in safe environment     |
| Retention               | quarterly                                    | review candidate reports and cleanup readiness |
| Providers/transfers     | quarterly + new provider/subprocessor notice | update evidence inventory                      |
| Incidents               | quarterly tabletop + after incidents         | update playbooks and evidence                  |
| Public policies         | quarterly + launch/significant changes       | counsel review for material legal language     |

## Escalation Rules

Escalate to Privacy Owner when:

- lawful basis is uncertain;
- data is newly sensitive or high-risk;
- public policy wording may need to change;
- users lose control/visibility over their data;
- data leaves StageLink for a new provider or country;
- a retention/deletion promise cannot be met.

Escalate to counsel when:

- breach notification may be required;
- Article 22/significant automated decision-making may be implicated;
- minors, special category data, biometric data, or high-risk profiling appears;
- international transfer mechanism is uncertain;
- legal obligation conflicts with deletion/retention.

## Overhead Controls

- Do not require meetings for every minor change.
- Use checklist evidence in tickets/PRs.
- Batch low-risk documentation updates into monthly review.
- Stop a launch only for unresolved Critical/High privacy risks.
- Keep final accountability with one Privacy Owner.
