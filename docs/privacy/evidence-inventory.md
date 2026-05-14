# Compliance Evidence Inventory

Status: Privacy Plan - evidence inventory baseline.
Date: 2026-05-14

This inventory describes what evidence StageLink should maintain, where it
should live, and who owns it. Confidential artifacts should not be committed to
git.

## Evidence Inventory Matrix

| Evidence category       | What should exist                                                                                      | Current/source location                   | Confidential storage                                           | Owner                          | Review cadence                       | Status                                             |
| ----------------------- | ------------------------------------------------------------------------------------------------------ | ----------------------------------------- | -------------------------------------------------------------- | ------------------------------ | ------------------------------------ | -------------------------------------------------- |
| Privacy documentation   | `/docs/privacy/` files, validation audits, gap analysis                                                | git repository                            | not needed for public architecture docs                        | Privacy Owner                  | quarterly                            | active                                             |
| ROPA                    | `ropa.md`, review notes, change history                                                                | `/docs/privacy/ropa.md`                   | review notes may live in private ticket/docs                   | Privacy Owner                  | quarterly + changes                  | baseline created                                   |
| Public policies         | Privacy Policy, Cookie Policy, Terms, version history, counsel notes                                   | public app/policy files when implemented  | counsel notes and drafts outside git if sensitive              | Privacy Owner                  | quarterly + launch                   | structures exist; final policies pending           |
| Consent evidence        | cookie banner screenshots, no-consent analytics test, withdrawal test, browser storage samples         | QA/manual test notes, future CI artifacts | private QA evidence folder if screenshots include account data | Product Owner                  | quarterly + SDK changes              | consent docs exist; recurring evidence pending     |
| DSAR evidence           | request logs, export/deletion test results, identity verification notes, provider completion checklist | `dsar_requests`, `audit_logs`, test notes | DSAR payloads outside git                                      | Support/Admin Owner            | quarterly                            | implementation exists; provider completion pending |
| Data inventory evidence | schema references, data-flow review notes, storage maps                                                | Prisma schema, docs                       | not needed unless using screenshots/provider details           | Engineering Privacy Reviewer   | quarterly + schema changes           | active                                             |
| Retention evidence      | retention policy, candidate reports, cleanup dry-runs, backup/log retention settings                   | docs, scripts output, provider consoles   | private if production counts/user details included             | Engineering Privacy Reviewer   | quarterly                            | policy exists; cleanup enforcement pending         |
| Provider evidence       | DPAs, SCCs/DPF, regions, subprocessors, retention, deletion support, support contacts                  | provider docs/consoles                    | private provider evidence register                             | Provider Owner                 | quarterly + provider changes         | incomplete                                         |
| Transfer evidence       | TIA, transfer mechanisms, supplementary measures, provider regions                                     | transfer docs + provider evidence         | private provider/counsel notes                                 | Privacy Owner + Provider Owner | quarterly                            | baseline exists; provider evidence pending         |
| Analytics evidence      | event inventory, PostHog/Umami settings, consent/opt-out test, retention/person-profile settings       | analytics docs, provider console          | provider screenshots outside git                               | Product Owner + Eng Reviewer   | quarterly + analytics changes        | baseline exists; settings evidence pending         |
| Incident evidence       | incident registry, severity decisions, evidence collection notes, postmortems, provider escalations    | private incident registry                 | confidential evidence store                                    | Security/Incident Owner        | after incidents + quarterly tabletop | docs exist; registry location pending              |
| Access/audit evidence   | audit logs, admin action reviews, denied cross-tenant tests, RBAC tests                                | `audit_logs`, CI/manual tests             | production logs outside git                                    | Engineering Privacy Reviewer   | quarterly                            | partial                                            |
| Payments evidence       | Stripe DPA/settings, webhook test logs, no-card-storage confirmation, subscription retention rationale | Stripe console, docs, CI/test logs        | private provider evidence register                             | Provider Owner                 | semiannual + changes                 | partial                                            |
| Infrastructure evidence | Vercel/Railway/GitHub settings, regions, log retention, backups, access reviews                        | provider consoles                         | private evidence register                                      | Engineering/Provider Owner     | quarterly                            | incomplete                                         |

## Evidence Naming Standard

Use stable names for private evidence artifacts:

`YYYY-MM-DD_area_system_control_owner`

Examples:

- `2026-05-14_consent_web_no-preconsent-posthog_product`
- `2026-05-14_provider_stripe_dpa-region-subprocessors_provider-owner`
- `2026-05-14_retention_api_candidate-report_engineering`

## Evidence Retention

- Keep privacy governance and provider evidence while the provider/control is
  active and for a reasonable audit period after replacement.
- Keep DSAR request records according to `request-lifecycle.md` and
  `logging-policy.md`.
- Keep incident evidence according to incident severity and legal/privacy review.
- Do not retain raw personal data evidence longer than needed to prove the
  control; prefer redacted screenshots, aggregate logs, and metadata.

## Evidence Collection Guidance

Collect evidence when:

- launching public policies;
- changing consent, analytics, DSAR, deletion, retention, providers, auth,
  payments, admin access, or tenant isolation;
- completing quarterly review;
- responding to an incident;
- receiving provider subprocessor/security notices;
- running annual compliance review.

Evidence should include:

- date;
- reviewer;
- system/provider;
- control tested;
- result;
- gaps and owner;
- link to ticket/PR/provider console where appropriate.

## Known Evidence Gaps

- Final legal entity/privacy contact and counsel review notes.
- Provider DPAs/SCCs/DPF/regions/subprocessors for all active providers.
- Vercel/Railway log retention and backup configuration.
- PostHog project settings screenshots/evidence.
- Raw analytics retention/anonymization execution evidence.
- Provider-side DSAR deletion/revocation completion tracking.
- Incident registry/evidence storage location outside git.
