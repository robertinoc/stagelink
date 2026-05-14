# Audit Readiness

Status: Privacy Plan - audit readiness baseline.
Date: 2026-05-14

This document defines how StageLink should prepare privacy/compliance evidence
for audits, legal review, investor due diligence, provider reviews, and
regulatory scrutiny. It is intentionally lightweight and startup-maintainable.

## Audit Pack

The minimum internal audit pack should include:

| Evidence area              | Required evidence                                                                                | Primary location                                         | Owner                        |
| -------------------------- | ------------------------------------------------------------------------------------------------ | -------------------------------------------------------- | ---------------------------- |
| ROPA                       | current `ropa.md`, quarterly review note, open gaps                                              | `/docs/privacy/ropa.md`, private evidence folder/tickets | Privacy Owner                |
| Data inventory/flows       | data inventory, flow maps, storage locations, schema references                                  | `/docs/privacy/`, repo                                   | Engineering Privacy Reviewer |
| Public policies            | approved Privacy Policy, Cookie Policy, Terms, version history                                   | public app/docs + private counsel notes                  | Privacy Owner                |
| Consent                    | consent UX screenshots, no-consent tracking test, withdrawal test, cookie/storage samples        | QA evidence folder, CI/manual test notes                 | Product Owner                |
| DSAR                       | request lifecycle records, export/deletion test evidence, identity verification notes            | `dsar_requests`, `audit_logs`, private evidence folder   | Support/Admin Owner          |
| Retention                  | retention policy, cleanup/candidate reports, backup/log retention settings                       | docs, scripts output, provider evidence                  | Engineering Privacy Reviewer |
| Providers/transfers        | DPA/SCC/DPF links or agreements, region/subprocessor evidence, vendor-risk reviews               | private provider evidence register                       | Provider Owner               |
| Security/privacy by design | RBAC/tenant isolation docs, logging policy, encryption/token handling docs, test evidence        | repo docs, CI, provider consoles                         | Engineering Privacy Reviewer |
| Incidents                  | incident registry, tabletop notes, breach assessments, postmortems, provider escalations         | private incident registry/evidence store                 | Security/Incident Owner      |
| Analytics/profiling        | event inventory, consent gating test, provider settings, opt-out evidence, profiling assessment  | docs, PostHog evidence, QA notes                         | Product Owner + Eng Reviewer |
| Payments                   | Stripe DPA/settings, webhook validation evidence, no-card-storage statement, retention rationale | Stripe console/evidence folder, docs                     | Provider Owner               |

## Evidence Storage Rules

- Keep public architecture and checklists in git.
- Keep secrets, provider account screenshots, counsel notes, incident details,
  DSAR payloads, and user-specific evidence outside git.
- Use stable references in docs: provider, artifact type, owner, review date,
  and storage location.
- Do not store full DSAR exports, tokens, payment records, or incident evidence
  in the repository.
- Evidence should be timestamped with UTC where possible.

## Compliance Evidence Checklist

Before public launch or a formal privacy audit, confirm:

- controller legal entity and privacy contact are finalized;
- public policies have counsel review and published version dates;
- ROPA is complete and reviewed within the last quarter;
- provider DPA/SCC/DPF/region/subprocessor evidence exists;
- cookie banner blocks analytics before consent;
- analytics withdrawal deletes/opts out known provider/browser identifiers;
- DSAR export and deletion flows have test evidence;
- account deletion does not break shared workspaces unexpectedly;
- retention candidate report has been run against staging or production safely;
- backup/log retention settings are documented;
- incident registry location exists and tabletop exercise has been run;
- admin access and sensitive actions have audit evidence where implemented;
- Stripe/WorkOS/PostHog/provider deletion boundaries are documented.

## Operational Privacy Checklist

Run this monthly:

- Review new merged PRs for privacy-relevant changes.
- Check open DSAR/privacy support requests.
- Check incident/security alerts and near misses.
- Check provider notices or subprocessor updates.
- Check whether any new env vars/providers were added.
- Check analytics events against `analytics-inventory.md`.
- Check retention cleanup/candidate status.
- Log "no material changes" if nothing changed.

## Audit Preparation Checklist

When preparing for an audit or diligence review:

1. Freeze a date-stamped snapshot of `/docs/privacy/`.
2. Export or link the current ROPA.
3. Gather provider evidence by provider.
4. Gather consent/DSAR/incident/retention test evidence.
5. Summarize known gaps without overstating completion.
6. Prepare a short architecture diagram or link to `data-flow-mapping.md`.
7. Identify data stores and provider consoles requiring live walkthrough.
8. Confirm no user-specific evidence is shared unless necessary and redacted.

## Evidence Quality Standard

Useful evidence should answer:

- What control or obligation does this prove?
- Which system/provider does it cover?
- Who reviewed it?
- When was it reviewed?
- What remains open?
- Where can a reviewer verify it?

Avoid vague evidence such as "configured correctly" without screenshots, docs,
logs, commit links, provider settings, or test results.

## Audit Readiness Risks

| Risk                                                                      | Severity | Mitigation                                                                       |
| ------------------------------------------------------------------------- | -------- | -------------------------------------------------------------------------------- |
| Provider evidence remains scattered across consoles and browser bookmarks | High     | Maintain `evidence-inventory.md` and private evidence folder.                    |
| Public policy claims outrun implementation                                | Critical | Tie policy language to implemented controls and open gaps.                       |
| DSAR/provider deletion evidence is manual and incomplete                  | High     | Track each provider deletion/revocation step per request.                        |
| Retention is documented but not automated                                 | High     | Keep retention candidate reports and implement cleanup jobs after legal signoff. |
| Consent tests are not repeated after analytics SDK changes                | Medium   | Add release checklist item for analytics SDK/provider changes.                   |

## Future TODOs

- Add a PR template privacy section.
- Add automated evidence links from CI to privacy docs for consent/DSAR tests.
- Add provider evidence review reminders.
- Add an internal "audit pack" index outside git for confidential artifacts.
