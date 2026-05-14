# Periodic Privacy Review Framework

Status: Privacy Plan - periodic review baseline.
Date: 2026-05-14

This framework defines recurring privacy checks that StageLink can sustain with
a small team.

## Monthly Operational Check

Timebox: 30 minutes.

Owner: Privacy Owner, with Engineering Privacy Reviewer or Support/Admin Owner
as needed.

Check:

- new privacy-relevant releases or PRs;
- open DSAR/privacy requests;
- incidents, security alerts, near misses, or provider notices;
- new providers/env vars/API scopes;
- analytics event changes;
- consent/privacy settings regressions;
- retention candidate/cleanup status;
- public policy changes needed.

Output:

- short dated note;
- new issues for unresolved High/Critical risks;
- "no material changes" note if nothing changed.

## Quarterly Privacy Review

Timebox: 60-90 minutes.

Owner: Privacy Owner.

Required review areas:

- ROPA rows and gaps;
- data inventory/data-flow changes;
- provider evidence and transfer mechanisms;
- consent and analytics opt-out behavior;
- DSAR/export/deletion test evidence;
- retention/anonymization/backups/logs;
- incident readiness and tabletop status;
- public policy accuracy;
- compliance gap analysis and implementation checklist.

Output:

- updated docs where needed;
- updated risk priorities;
- provider evidence follow-ups;
- signoff note with date, owner, and unresolved gaps.

## Annual Compliance Review

Timebox: half day.

Owner: Privacy Owner with counsel where needed.

Review:

- public Privacy Policy, Cookie Policy, Terms;
- ROPA completeness;
- legal basis mapping;
- DPA/SCC/DPF/provider evidence;
- international transfers and TIA assumptions;
- data retention/deletion practices;
- DSAR outcomes and open gaps;
- incident/breach readiness;
- analytics/profiling posture;
- AI/profiling/Article 22 risk if features changed;
- minors/age policy and jurisdiction posture.

Output:

- annual privacy review memo;
- counsel questions;
- updated implementation priorities;
- launch/readiness blockers if any.

## Incident-Driven Review

Trigger:

- High/Critical privacy/security incident;
- possible personal data breach;
- provider breach notification;
- cross-tenant exposure;
- auth/session/token compromise;
- accidental public exposure of private data.

Output:

- incident record;
- breach assessment and notification decision;
- evidence preservation;
- postmortem;
- control and documentation updates;
- ROPA/provider/retention updates if processing changed.

## Feature-Driven Review

Trigger:

- new high-risk feature before release;
- material privacy change from `change-management.md`.

Output:

- completed checklist;
- affected docs updated;
- evidence or test notes;
- risk decision.

## Review Calendar Recommendation

| Month                         | Focus                                         |
| ----------------------------- | --------------------------------------------- |
| January                       | annual compliance review, policy/ROPA refresh |
| Monthly                       | operational check                             |
| March/June/September/December | quarterly privacy review                      |
| After major launches          | feature-driven review                         |
| After incidents               | incident-driven review                        |

## Startup Sustainability Rules

- Keep monthly checks short.
- Batch Medium/Low documentation cleanup into quarterly review.
- Escalate only unresolved High/Critical risks.
- Use existing GitHub issues/PRs instead of a separate governance tool until
  volume requires it.
- Keep confidential evidence outside git but indexed in `evidence-inventory.md`.

## Review Failure Modes

| Failure mode                                     | Severity | Mitigation                         |
| ------------------------------------------------ | -------- | ---------------------------------- |
| No named Privacy Owner                           | High     | assign owner before public launch  |
| Quarterly reviews skipped                        | Medium   | recurring calendar/ticket          |
| Provider evidence not refreshed                  | High     | quarterly provider checklist       |
| ROPA stale after product changes                 | High     | PR/ticket trigger for ROPA updates |
| Evidence stored only in one person's local files | Medium   | shared private evidence location   |
