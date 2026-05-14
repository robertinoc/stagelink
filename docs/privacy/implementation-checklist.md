# Privacy Implementation Checklist

Status: missing information and implementation backlog for the Privacy Plan.

## Legal Inputs Needed

- Final StageLink legal entity name.
- Legal address.
- Privacy contact email.
- Support/DSAR email.
- Governing law and dispute venue.
- Whether StageLink will appoint a DPO or EU representative.
- Whether StageLink will offer a DPA to artists.
- Final minimum age and guardian-consent posture.
- Final refund/cancellation policy for paid plans.

## Product/Technical Inputs Needed

- Final analytics stack: PostHog, Umami, both, or one.
- Production region for Railway DB/API.
- Storage provider and region.
- Email provider for contact/transactional mail.
- Whether public contact forms store messages or only send email.
- Whether subscriber/fan exports exist at launch.
- Whether account deletion is soft-delete only or hard-delete/anonymization.
- Retention periods by data category.
- Whether marketing emails are planned at launch.
- Final provider regions, DPAs/SCCs, and log retention for Vercel, Railway,
  WorkOS, Stripe, PostHog, Resend, storage, and Upstash if used.
- Final international transfer mechanism per active provider: adequacy, SCCs,
  EU-US Data Privacy Framework certification if applicable, UK/Swiss addenda,
  and supplementary measures.
- Final provider evidence register for WorkOS, Vercel, Railway, Stripe,
  PostHog, Resend, EmailJS, storage, Upstash, Spotify, YouTube/Google,
  SoundCloud, Shopify, Printful, and any future provider.
- Final SoundCloud production posture: official API use confirmed, or
  server-side SoundCloud sync disabled.
- Final EmailJS posture: DPA/retention/subprocessors accepted, or public
  contact forms moved to a reviewed server-side email provider.
- Final YouTube launch posture: API-key public data only, unless OAuth receives
  separate scope/revocation/deletion review.
- Final backup policy once Railway Pro is enabled.
- Final fan/subscriber DSAR ownership model: artist-handled, StageLink-handled,
  or shared intake.
- Final raw analytics, audit-log, provider-snapshot, failed-upload, and runtime
  log retention periods.
- Whether WorkOS step-up or delayed deletion is required before public account
  deletion.
- Whether Behind admin user search/detail access needs per-event audit trails
  before launch.
- Whether inactive-account automation should exist at launch or remain manual.
- Final downgrade grace periods and feature-specific cleanup rules for FREE,
  PRO, and PRO+.

## Implementation Backlog

### Critical Before Public Launch

- Publish lawyer-reviewed Privacy Policy.
- Publish lawyer-reviewed Terms of Service.
- Publish lawyer-reviewed Cookie Policy.
- Implement consent banner with Reject non-essential and Manage choices.
- Block non-essential analytics/tracking before consent where required.
- Define manual DSAR process at minimum: access, correction, deletion,
  portability, consent withdrawal.
- Define account deletion behavior and subscriber deletion routing.
- Confirm provider DPAs/SCCs and production regions.
- Complete international transfer impact assessment evidence for active
  providers, including DPF entity checks where relied on.
- Complete provider compliance/evidence register.
- Decide SoundCloud and EmailJS launch posture.
- Confirm object-storage provider, region, lifecycle, and deletion behavior.

### High Before Paid Growth

- Build self-service data export.
- Build self-service account deletion or verified deletion request flow.
- Implement retention/anonymization jobs for analytics and deleted accounts.
- Add retention/anonymization jobs for QA/internal analytics, platform insights
  snapshots, Stripe webhook idempotency records, audit logs, failed uploads,
  and orphaned object-storage assets.
- Run retention candidate reports in staging with
  `pnpm data:retention:candidates` and archive the output as launch evidence.
- Add provider-side deletion/revocation runbook for WorkOS, Stripe, PostHog,
  object storage, Resend/email, Vercel/Railway logs, and connected providers.
- Verify object-storage deletion behavior during account/workspace erasure.
- Add Behind admin access audit events for user search, detail view, status
  changes, role changes, invitations, debug-header access, and destructive
  actions.
- Add WorkOS step-up/email challenge or delayed deletion for destructive account
  deletion before public scale.
- Add subscriber unsubscribe/delete support.
- Add privacy settings page.
- Document incident/data breach process with 72-hour GDPR assessment workflow.

### Medium

- Add Global Privacy Control support if marketing/analytics expands.
- Add consent versioning and audit history.
- Add privacy review checklist for new integrations.
- Add recurring transfer review workflow for new providers, new regions, new
  OAuth scopes, marketing pixels, support tools, and CI/CD artifact changes.
- Add mandatory provider/scope review for new OAuth providers, write scopes,
  Shopify Admin API, Printful/Printify order/customer access, new analytics
  vendors, email/support vendors, and third-party embed providers.
- Add periodic data inventory review.
- Add Spanish translation of public legal documents.
- Add server-side consent event ledger if regulator-grade consent history is
  needed.
- Add database RLS or read-only reporting views if StageLink introduces direct
  database reporting outside the API.
- Add `lastActiveAt` or equivalent local activity signal before inactive
  account automation.
- Add entitlement-aware downgrade cleanup only after product limits are final.

## Documentation Maintenance Rule

Any feature that adds a new personal data category, provider, integration,
tracking event, cookie, export, or admin access path must update:

- `data-inventory.md`
- `data-classification.md`
- `data-flow-mapping.md`
- `storage-locations.md`
- `retention-policy.md`
- `third-party-processors.md`
- `providers-and-transfers.md`
- `integrations-inventory.md`
- `external-data-flows.md`
- `oauth-architecture.md`
- `api-scope-review.md`
- `provider-compliance-matrix.md`
- `international-transfer-impact-assessment.md`
- `international-transfers-validation-audit.md`
- `third-party-risk-analysis.md`
- `compliance-gap-analysis.md`
- Relevant public policy structure
- `privacy-by-design.md`
- `multi-tenant-isolation.md`
- `logging-policy.md`
- `access-audit-strategy.md`
- `retention-policy.md`
- `account-lifecycle.md`
- `cleanup-jobs.md`
