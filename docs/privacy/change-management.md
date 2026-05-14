# Privacy Change Management

Status: Privacy Plan - change-management baseline.
Date: 2026-05-14

This document defines privacy gates for product, engineering, provider, and
operations changes.

## Change Classification

| Change level | Examples                                                                                                                                                         | Required action                                                 |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| Low          | copy-only UI edits, styling, non-data bug fix, internal refactor with no data-flow change                                                                        | no formal privacy review; note if relevant                      |
| Medium       | new field using existing data category, dashboard display of existing private data, minor event metadata reduction                                               | lightweight privacy review; update docs if behavior changes     |
| High         | new provider/integration, new analytics event family, export/import, retention/logging change, admin access path, public/private visibility change               | material privacy review; update affected docs and ROPA          |
| Critical     | breach-impacting control, auth/session model, tenant isolation, payment processing, AI/profiling with significant effect, cross-border transfer mechanism change | Privacy Owner approval and likely counsel review before release |

## Mandatory Documentation Update Triggers

Update `/docs/privacy/` and, where relevant, `ropa.md` when adding/changing:

- personal data fields or Prisma models;
- WorkOS/AuthKit auth/session behavior;
- Stripe payment/subscription metadata;
- public profile/EPK publication behavior;
- subscriber/fan capture data;
- analytics events, PostHog/Umami config, local analytics schema;
- StageLink Insights provider data or snapshots;
- integrations, OAuth scopes, tokens, webhooks, provider APIs;
- object storage, CDN, backups, runtime logs, or build artifacts containing
  personal data;
- DSAR/export/deletion/rectification logic;
- account deletion, retention cleanup, anonymization, legal hold behavior;
- admin/support access paths;
- incident detection, alerting, or evidence handling.

## New Integration Gate

Before adding a provider:

- document purpose and data categories;
- confirm provider role: processor, independent controller, joint controller, or
  unclear/vendor relationship;
- collect DPA/SCC/DPF/region/subprocessor evidence when applicable;
- review OAuth/API scopes and tokens;
- define deletion/disconnect behavior;
- define retention and logs;
- update provider, transfer, ROPA, and evidence docs;
- decide public policy disclosure.

## Analytics and Profiling Gate

Before adding analytics/profiling:

- confirm whether the event is necessary and minimal;
- avoid free text, email, tokens, payment details, content body, or sensitive
  metadata;
- decide consent/preference/legitimate-interest basis;
- verify pre-consent blocking for public/non-essential analytics;
- document opt-out/withdrawal behavior;
- assess whether profiling, segmentation, ranking, recommendation, or Article 22
  risk exists;
- update analytics inventory, profiling analysis, provider review, and ROPA.

## Retention and Deletion Gate

Before changing retention/deletion:

- define affected tables/providers/logs/backups;
- confirm legal/accounting/security retention conflicts;
- dry-run destructive jobs in staging;
- document rollback and restoration risks;
- confirm provider-side deletion/revocation steps;
- update retention, deletion, cleanup, DSAR, backup, and ROPA docs.

## Authentication and Access Gate

Before changing auth/access:

- review WorkOS/AuthKit configuration and claims;
- confirm tenant membership checks;
- confirm admin/Behind access audit behavior;
- review session revocation/deletion implications;
- add tests for unauthorized access and cross-tenant denial;
- update RBAC, tenant isolation, logging, incident, and ROPA docs.

## Release Decision Rules

| Risk state                       | Release posture                                                                 |
| -------------------------------- | ------------------------------------------------------------------------------- |
| Critical unresolved privacy risk | block release unless Privacy Owner and counsel explicitly accept emergency risk |
| High unresolved privacy risk     | block broad public release; may allow private QA with documented guardrails     |
| Medium unresolved privacy risk   | release possible with owner, due date, and mitigation issue                     |
| Low unresolved privacy risk      | track in backlog                                                                |

## Change Evidence

For material changes, keep:

- ticket/PR link;
- reviewer;
- affected docs;
- affected systems/providers;
- tests run;
- unresolved risk decision;
- release date.

## Future TODOs

- Add privacy fields to PR template.
- Add code search checks for new provider env vars and analytics imports.
- Add schema migration checklist for personal data fields.
- Add GitHub labels for `privacy-review`, `provider-review`, `ropa-update`,
  and `retention-change`.
