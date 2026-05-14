# Compliance Checklists

Status: Privacy Plan - operational checklist baseline.
Date: 2026-05-14

These checklists are for engineers, product owners, and operators shipping
privacy-sensitive changes. They are not a substitute for legal review when the
change is high-risk.

## New Feature Launch Checklist

- Define the user-facing purpose.
- Identify data fields collected, generated, imported, displayed, exported, or
  logged.
- Confirm whether data is public, private, tenant-scoped, provider-held, or
  browser-local.
- Confirm lawful basis or user consent path.
- Confirm access control and tenant isolation.
- Confirm DSAR export/deletion impact.
- Confirm retention/anonymization impact.
- Confirm logs do not include secrets, tokens, payment details, or free-text
  personal data unnecessarily.
- Update ROPA/docs if the data category, purpose, provider, transfer, or
  retention changes.
- Add test evidence or manual QA notes for privacy-critical behavior.

## New Integration Checklist

- Provider name and product.
- Processing purpose.
- Data categories sent/received.
- Provider role and responsibility boundary.
- DPA/SCC/DPF/region/subprocessor evidence.
- OAuth/API scopes and least-privilege review.
- Token storage/encryption and revocation path.
- Disconnect/delete behavior.
- Provider logs/retention.
- Public policy disclosure.
- Incident escalation path.
- ROPA and provider docs updated.

## Analytics Checklist

- Event purpose is specific and product-relevant.
- Event cannot be answered with a less identifying aggregate.
- No raw email, name, token, payment data, message body, IP, or full URL unless
  separately approved.
- Public/non-essential analytics blocked before consent.
- Opt-out/withdrawal tested.
- Provider settings reviewed: autocapture, replay, heatmaps, IP, retention,
  region, person profile, exports.
- Profiling/segmentation/recommendation impact assessed.
- Analytics inventory and ROPA updated.

## Retention Change Checklist

- Affected tables/providers/logs/backups listed.
- Legal/accounting/security retention conflicts reviewed.
- DSAR deletion and account deletion implications reviewed.
- Dry-run candidate report available.
- Destructive cleanup has rollback/restore plan.
- Provider-side deletion/revocation documented.
- User-facing policy language still accurate.
- Retention and ROPA docs updated.

## Authentication and Account Flow Checklist

- WorkOS/AuthKit behavior understood.
- Session and token handling reviewed.
- Tenant membership and role checks tested.
- Suspended/deleted user behavior tested.
- Account deletion requires adequate verification or delayed completion.
- Sensitive auth/admin actions audited where implemented.
- Incident playbook updated if new failure mode exists.

## Public Profile/EPK Checklist

- Publish state is explicit.
- User understands what becomes public.
- Private drafts are not exposed through public routes/API.
- Contact, rider, availability, staff, and location fields are treated as
  higher-risk.
- Search/social/browser caching disclosure remains accurate.
- Deletion/unpublish behavior tested.

## Fan/Subscriber Checklist

- Capture form has clear consent/notice where required.
- Subscriber email is private to the artist workspace.
- Export access is restricted and audited where implemented.
- Unsubscribe/delete/DSAR path exists or is documented as a gap.
- Analytics capture is separated from subscriber record processing.
- Consent text snapshot is stored when needed.

## Payments Checklist

- Stripe-hosted payment collection used; no raw card data stored by StageLink.
- Stripe customer/subscription IDs are minimal.
- Webhook signature validation and idempotency verified.
- Billing admin access is restricted.
- Retention/legal obligations documented.
- Stripe DPA/subprocessor/region evidence captured.

## Incident/Privacy Operation Checklist

- Incident registry location exists.
- Severity classification is applied.
- Evidence is preserved outside git.
- Provider escalation path is known.
- 72-hour GDPR assessment clock is considered when personal data breach is
  suspected.
- Postmortem updates docs/checklists when controls change.

## Documentation Update Checklist

Update only the affected docs, but check whether the change touches:

- `data-inventory.md`
- `data-flow-mapping.md`
- `storage-locations.md`
- `third-party-processors.md`
- `providers-and-transfers.md`
- `retention-policy.md`
- `dsar-architecture.md`
- `privacy-by-design.md`
- `analytics-inventory.md`
- `profiling-analysis.md`
- `incident-response-plan.md`
- `ropa.md`
- `evidence-inventory.md`
- `compliance-gap-analysis.md`
- `implementation-checklist.md`
