# Privacy Governance Overview

Status: Privacy Plan - governance and documentation baseline.
Date: 2026-05-14

This document defines the internal privacy governance model for StageLink. It is
designed for a small SaaS team: clear ownership, lightweight reviews, practical
evidence, and no enterprise-only ceremony.

This is operational documentation, not public marketing copy or final legal
advice.

## Governance Principles

StageLink privacy governance should be:

- evidence-based: decisions must point to docs, tickets, commits, provider
  records, or incident/DSAR records;
- engineering-friendly: review gates should fit normal product delivery;
- small-team realistic: one accountable owner, named backups, and focused
  checklists;
- risk-based: heavier review only for sensitive data, providers, transfers,
  profiling, auth, payments, retention, or tenant isolation;
- maintainable: every privacy document must have an owner, review cadence, and
  update trigger.

## Documentation Architecture

StageLink uses `/docs/privacy/` as the source of truth for internal privacy
architecture and operational controls.

Recommended structure:

| Documentation area           | Files                                                                                            | Purpose                                                                                              |
| ---------------------------- | ------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------- |
| Legal/privacy baseline       | `legal-foundations.md`, public policy structures, validation audits                              | Explain legal posture, legal bases, policy drafts, and unresolved counsel review items.              |
| Data mapping                 | `data-inventory.md`, `data-flow-mapping.md`, `storage-locations.md`, `data-classification.md`    | Keep a current map of data categories, systems, storage, flows, and risk levels.                     |
| Consent and DSAR             | consent, cookie, DSAR, export, deletion, identity, lifecycle docs                                | Define user rights, consent behavior, and privacy request operations.                                |
| Privacy engineering controls | Privacy-by-Design, isolation, encryption, logging, RBAC, anonymization, access audit docs        | Define implementation guardrails engineers must use when changing core systems.                      |
| Retention/lifecycle          | retention, cleanup, account lifecycle, downgrade, inactive account, deletion strategy docs       | Define storage limitation, deletion, anonymization, and cleanup review.                              |
| Providers/transfers          | provider, integration, OAuth, scope, third-party, transfer, TIA docs                             | Track processors, OAuth providers, international transfers, DPAs/SCCs, and provider risks.           |
| Incidents                    | incident response, breach classification, notification workflow, playbooks, templates, registry  | Provide breach/incident response workflows and evidence requirements.                                |
| Analytics/profiling          | analytics inventory, profiling, consent, opt-out, minimization, anonymization, provider review   | Govern product analytics, public metrics, PostHog/Umami, and StageLink Insights profiling risk.      |
| Governance/ROPA              | this file, `ropa.md`, review processes, evidence inventory, audit readiness, checklists, cadence | Provide Article 30-ready records and operating procedures for keeping privacy documentation current. |

## Privacy Ownership Model

StageLink should assign roles by responsibility, not by creating a large
committee.

| Role                         | Primary responsibilities                                                                                    | Startup-sized staffing model                                   |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| Privacy Owner                | Maintains privacy roadmap, approves privacy docs, owns ROPA, coordinates counsel and audit evidence.        | Founder, COO, senior product lead, or designated privacy lead. |
| Engineering Privacy Reviewer | Reviews code/design changes touching personal data, auth, analytics, providers, exports, or retention.      | Senior engineer or tech lead.                                  |
| Security/Incident Owner      | Owns incident response, breach registry, detection priorities, and evidence preservation.                   | Engineering lead or ops/security-capable founder.              |
| Product Owner                | Ensures feature specs include data purpose, UX disclosures, consent, opt-out, and DSAR implications.        | Product/founder owner for the affected area.                   |
| Provider Owner               | Maintains provider evidence, DPAs, SCCs, regions, subprocessors, and vendor-risk status.                    | Ops/privacy owner with engineering support.                    |
| Support/Admin Owner          | Handles DSAR intake, support privacy issues, admin access procedures, and user communications.              | Support lead, founder, or rotating operator.                   |
| Legal Counsel                | Reviews final public policies, DPAs, lawful-basis decisions, breach notification decisions, and edge cases. | External counsel as-needed, not a full-time internal function. |

## Governance Matrix

| Governance area           | Owner                        | Cadence              | Related systems/docs                                            | Evidence required                                             | Risk        | Escalation path                                  |
| ------------------------- | ---------------------------- | -------------------- | --------------------------------------------------------------- | ------------------------------------------------------------- | ----------- | ------------------------------------------------ |
| ROPA                      | Privacy Owner                | Quarterly + changes  | `ropa.md`, data inventory, providers, retention docs            | dated ROPA review note, changed rows, open gaps               | High        | Privacy Owner -> counsel for lawful-basis issues |
| Data inventory and flows  | Engineering Privacy Reviewer | Quarterly + changes  | DB schema, APIs, integrations, `data-inventory.md`              | diff/review notes, schema changes, data-flow updates          | High        | Engineering lead -> Privacy Owner                |
| Consent/cookies           | Product Owner                | Quarterly + releases | consent manager, cookie docs, analytics docs                    | QA screenshots/logs, consent test results, policy updates     | High        | Product -> Privacy Owner -> counsel if uncertain |
| DSAR/export/deletion      | Support/Admin Owner          | Quarterly            | DSAR endpoints, deletion strategy, provider deletion runbooks   | request logs, completion records, export/deletion test notes  | High        | Support -> Privacy Owner -> Engineering          |
| Retention/lifecycle       | Engineering Privacy Reviewer | Quarterly            | retention docs, cleanup jobs, database/report scripts           | retention candidate output, cleanup decisions, legal holds    | High        | Engineering -> Privacy Owner -> counsel          |
| Providers/transfers       | Provider Owner               | Quarterly + vendors  | processor matrix, transfer docs, OAuth scope review             | DPA/SCC/region/subprocessor evidence, review date             | High        | Provider Owner -> Privacy Owner -> counsel       |
| Incident/breach readiness | Security/Incident Owner      | Quarterly + events   | incident docs, detection, playbooks, registry                   | tabletop notes, incident records, alert-review notes          | High        | Incident Owner -> Privacy Owner -> counsel       |
| Analytics/profiling       | Product Owner + Eng Reviewer | Quarterly + events   | analytics/profiling docs, PostHog/Umami config, insights tables | event inventory, provider settings, opt-out/consent test logs | High        | Product/Eng -> Privacy Owner -> counsel if novel |
| Auth/access control       | Engineering Privacy Reviewer | Quarterly + changes  | WorkOS, RBAC, audit logs, tenant isolation docs                 | auth change reviews, access audit logs, denied-access tests   | High        | Engineering -> Security/Incident Owner           |
| Payments/billing          | Provider Owner + Engineering | Semiannual + changes | Stripe docs, subscription tables, webhook handling              | Stripe DPA/settings, webhook test logs, retention rationale   | Medium/High | Provider Owner -> Privacy Owner -> counsel       |
| Public policy docs        | Privacy Owner                | Quarterly + launch   | policy structures, legal foundations, public app pages          | counsel review notes, release date, policy version            | High        | Privacy Owner -> counsel                         |

## Documentation Ownership Rules

Every privacy document should have:

- a status line;
- last material review date;
- owner or owner role;
- update triggers;
- links to related docs or implementation files where useful;
- known gaps when implementation or provider evidence is incomplete.

Do not claim a control is complete unless it is implemented, tested, and
evidenced. Use "pending", "requires confirmation", or "launch blocker" where
that is the truthful status.

## Minimal Review Cadence

| Review type               | Frequency                        | Output                                                             |
| ------------------------- | -------------------------------- | ------------------------------------------------------------------ |
| Monthly operational check | 30 minutes                       | short note covering incidents, DSARs, providers, consent, logs     |
| Quarterly privacy review  | 60-90 minutes                    | ROPA/doc updates, risk register updates, high-priority backlog     |
| Annual compliance review  | half day                         | public policy review, provider evidence refresh, ROPA signoff      |
| Incident-driven review    | after High/Critical incident     | postmortem, doc/control updates, breach-notification evidence      |
| Feature-driven review     | before release of high-risk work | checklist completion, documentation diff, unresolved risk decision |

## Governance Risk Analysis

### Critical

- Public launch without final public policy/counsel review and provider evidence
  would weaken accountability.
- Missing destructive retention jobs could leave personal data beyond stated
  retention periods.

### High

- ROPA can become stale if new integrations, analytics, AI/profiling, or
  retention changes do not trigger documentation updates.
- Provider evidence is distributed across consoles and docs and needs one
  maintained evidence inventory.
- Authenticated product analytics still needs final lawful-basis and opt-out or
  objection posture.
- DSAR/provider deletion completion remains partly manual and may be hard to
  prove under audit.

### Medium

- Small-team ownership may fail if the Privacy Owner is not explicitly assigned.
- Quarterly reviews can slip without a recurring calendar/ticket.
- Audit evidence may exist in CI, GitHub, provider consoles, and tickets but not
  be linked from one inventory.

### Low

- The documentation set is broad and may feel heavy unless the team uses
  checklists and updates only the affected files.
- Future automation tooling may be unnecessary before public scale.

## Operational Recommendations

1. Assign a named Privacy Owner before public scale.
2. Treat `ropa.md` and `evidence-inventory.md` as the minimum audit pack.
3. Add a privacy-review checkbox to feature tickets touching personal data.
4. Keep provider evidence outside git if it contains account details, but link
   proof location and review date from `evidence-inventory.md`.
5. Use quarterly 60-90 minute reviews instead of continuous committee meetings.
6. Update ROPA when code changes data categories, providers, transfers,
   retention, profiling, or user rights behavior.
7. Keep a small risk backlog in `implementation-checklist.md` and
   `compliance-gap-analysis.md`.

## Future TODOs

- Automate privacy review prompts in GitHub PR templates.
- Add a private evidence folder or vault index for DPAs, SCCs, provider
  screenshots, and counsel notes.
- Add a lightweight privacy dashboard for retention candidates, DSAR status,
  incident readiness, and provider review dates.
- Add ROPA export tooling if manual Markdown becomes hard to maintain.
- Add automated checks for new analytics events, provider env vars, and
  migration-added personal data fields.
