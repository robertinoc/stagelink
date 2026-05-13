# StageLink Privacy Program

Status: legal foundations, cookie consent, and DSAR baseline for the Privacy Plan.

This folder contains StageLink's privacy architecture documentation for the
pre-launch privacy workstream. The first phase was documentation-only; later
phases include consent and DSAR product/backend implementation notes.

## Scope

This baseline covers:

- StageLink's privacy role and legal posture.
- Applicable privacy regimes for a global SaaS product.
- Initial lawful-basis mapping.
- Minimum age and jurisdiction recommendations.
- Data inventory and provider/transfer mapping.
- Privacy Policy, Terms of Service, and Cookie Policy structures.
- Cookie consent architecture and validation.
- DSAR access, rectification, erasure, portability, and request logging.
- Compliance gaps and validation findings.

## Documents

| File                                    | Purpose                                                              |
| --------------------------------------- | -------------------------------------------------------------------- |
| `legal-foundations.md`                  | Legal role, applicable regulations, lawful bases, age, jurisdiction. |
| `data-inventory.md`                     | Initial data inventory, storage, purposes, retention rationale.      |
| `providers-and-transfers.md`            | Third-party providers, subprocessors, transfers, and review needs.   |
| `privacy-policy-structure.md`           | StageLink-specific Privacy Policy structure.                         |
| `terms-of-service-structure.md`         | StageLink-specific Terms of Service structure.                       |
| `cookie-policy-structure.md`            | Cookie categories, consent posture, opt-out/opt-in plan.             |
| `cookie-architecture.md`                | Implemented consent categories, storage, versioning, withdrawal.     |
| `consent-flow.md`                       | Runtime consent UX and tracking blocking flow.                       |
| `tracking-inventory.md`                 | Current tracking systems and no-consent behavior.                    |
| `implementation-notes.md`               | E2 implementation summary and technical compliance checklist.        |
| `consent-validation-audit.md`           | Validation audit for consent/cookie implementation.                  |
| `dsar-architecture.md`                  | DSAR rights support, endpoint flow, identity, auditability.          |
| `deletion-policy.md`                    | Account deletion/anonymization strategy and retained data rationale. |
| `data-export-structure.md`              | JSON export scope, redactions, and format decisions.                 |
| `identity-verification.md`              | DSAR authentication and destructive-action verification posture.     |
| `request-lifecycle.md`                  | DSAR status model, SLA targets, and operational review.              |
| `dsar-compliance-checklist.md`          | GDPR/CCPA DSAR checklist and testing edge cases.                     |
| `dsar-validation-audit.md`              | Validation audit for DSAR implementation.                            |
| `implementation-checklist.md`           | Missing information and implementation checklist.                    |
| `compliance-gap-analysis.md`            | Severity-ranked privacy/compliance gaps.                             |
| `legal-foundations-validation-audit.md` | Independent validation audit of this documentation set.              |

## Legal review boundary

These documents are product/legal architecture inputs, not final legal advice.
Before public launch or meaningful user acquisition, StageLink should have a
qualified lawyer review the final public Privacy Policy, Terms of Service,
Cookie Policy, DPAs, international transfer language, age policy, and governing
law clause.

## Sources Used

- GDPR Regulation (EU) 2016/679 official text:
  https://eur-lex.europa.eu/eli/reg/2016/679/oj
- EDPB Guidelines 07/2020 on controller and processor concepts:
  https://www.edpb.europa.eu/our-work-tools/our-documents/guidelines/guidelines-072020-concepts-controller-and-processor-gdpr_en
- California Attorney General CCPA page:
  https://oag.ca.gov/privacy/ccpa
- California Privacy Protection Agency:
  https://cppa.ca.gov/
- Argentina Data Protection Law 25.326 official reference:
  https://www.argentina.gob.ar/normativa/nacional/ley-25326-64790
- FTC Children's Privacy / COPPA business guidance:
  https://www.ftc.gov/business-guidance/privacy-security/childrens-privacy
