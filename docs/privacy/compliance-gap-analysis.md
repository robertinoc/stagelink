# Compliance Gap Analysis

Status: baseline risk analysis for privacy legal foundations, consent, DSAR,
data mapping, Privacy-by-Design, retention/lifecycle governance, third-party
integrations, international transfers, incident/breach response,
analytics/profiling privacy, governance/ROPA readiness, and Privacy UX
transparency.

## Current Baseline

StageLink now has:

- legal role and lawful-basis documentation;
- privacy policy, terms, and cookie policy structures;
- provider/transfer inventory;
- GDPR-first consent architecture;
- DSAR access, rectification, erasure, portability, and request logging;
- data inventory, data classification, data-flow mapping, storage mapping,
  processor inventory, and retention baseline.
- Privacy-by-Design documentation for minimization, tenant isolation,
  encryption, logging, anonymization, RBAC, and access auditing.
- retention/lifecycle documentation for account states, deletion strategy,
  inactive accounts, downgrade behavior, cleanup jobs, and candidate reporting.
- third-party/integrations documentation for provider inventory, external data
  flows, OAuth/token posture, API scopes, provider compliance evidence, and
  third-party risk analysis.
- international transfer documentation for transfer mechanisms, provider
  evidence, supplementary measures, transfer impact questions, and transfer
  readiness validation.
- incident and breach response documentation for classification, severity,
  detection, response workflows, registry structure, GDPR notification,
  communications, third-party dependencies, playbooks, and readiness audit.
- analytics/profiling documentation for analytics inventory, consent,
  opt-out, minimization, pseudonymization, provider exposure, public analytics
  visibility, StageLink Insights, GDPR Article 22 assessment, and readiness
  audit.
- privacy governance documentation for documentation architecture, ROPA,
  ownership, evidence inventory, audit readiness, review processes, change
  management, operational checklists, periodic review, and governance audit.
- privacy UX documentation and implementation for dashboard privacy settings,
  consent controls, onboarding privacy cues, integration transparency, data-use
  explanations, visibility model, and UX validation.

Privacy Plan Data Mapping produced these operational documents:

- `data-inventory.md`
- `data-classification.md`
- `data-flow-mapping.md`
- `storage-locations.md`
- `retention-policy.md`
- `third-party-processors.md`
- `data-mapping-validation-audit.md`

Privacy-by-Design produced these operational documents:

- `privacy-by-design.md`
- `multi-tenant-isolation.md`
- `encryption-strategy.md`
- `logging-policy.md`
- `anonymization-policy.md`
- `rbac-architecture.md`
- `access-audit-strategy.md`
- `privacy-by-design-validation-audit.md`

Data Retention and Lifecycle produced these operational documents:

- `retention-policy.md`
- `account-lifecycle.md`
- `deletion-strategy.md`
- `inactive-account-policy.md`
- `downgrade-retention-policy.md`
- `cleanup-jobs.md`
- `retention-lifecycle-validation-audit.md`
- `scripts/data/retention-candidates.sql`
- `scripts/data/run-retention-candidates.mjs`

Third-Party and Integrations produced these operational documents:

- `integrations-inventory.md`
- `external-data-flows.md`
- `oauth-architecture.md`
- `api-scope-review.md`
- `provider-compliance-matrix.md`
- `third-party-risk-analysis.md`
- `third-party-integrations-validation-audit.md`

International Transfers produced these operational documents:

- `international-transfer-impact-assessment.md`
- `international-transfers-validation-audit.md`

Incident Response and Data Breach Management produced these operational
documents:

- `incident-response-plan.md`
- `breach-classification.md`
- `breach-notification-workflow.md`
- `incident-registry-structure.md`
- `response-playbooks.md`
- `breach-communication-templates.md`
- `detection-strategy.md`
- `incident-response-validation-audit.md`

Analytics and Profiling produced these operational documents:

- `analytics-inventory.md`
- `profiling-analysis.md`
- `analytics-consent.md`
- `telemetry-minimization.md`
- `anonymization-strategy.md`
- `analytics-optout.md`
- `provider-analytics-review.md`
- `analytics-profiling-validation-audit.md`

Privacy Governance and ROPA produced these operational documents:

- `governance-overview.md`
- `ropa.md`
- `audit-readiness.md`
- `privacy-review-process.md`
- `compliance-checklists.md`
- `evidence-inventory.md`
- `change-management.md`
- `periodic-review-framework.md`
- `governance-validation-audit.md`

Privacy UX and Transparency produced these operational documents:

- `privacy-ux-guidelines.md`
- `onboarding-privacy.md`
- `transparency-copy.md`
- `visibility-model.md`
- `consent-ux-review.md`
- `integrations-transparency.md`
- `privacy-ux-validation-audit.md`

## Critical

### Public legal documents are not final

StageLink does not yet have finalized, lawyer-reviewed public Privacy Policy,
Terms of Service, and Cookie Policy documents.

Risk:

- Users may not receive required transparency.
- GDPR/CCPA/Argentina disclosures may be incomplete.
- Paid plans and public content rules may lack enforceable terms.

Fix:

- Convert structures in this folder into final public policies.
- Obtain legal review before public launch.

### Governance evidence could be incomplete at launch

StageLink now has an internal governance framework and ROPA structure, but
controller/contact fields, named owners, confidential evidence storage, provider
evidence, and public policy counsel review are not final.

Risk:

- StageLink could have good documentation but weak proof during a privacy audit.
- Public policy claims may outrun implemented/evidenced controls.
- ROPA could be structurally complete but factually incomplete.

Fix:

- Assign named privacy governance owners.
- Create a private evidence register/folder outside git.
- Complete controller legal entity, privacy contact, representative assessment,
  provider evidence, and quarterly ROPA review notes.

### Non-essential analytics consent was not GDPR-ready

Privacy Plan E2 replaced the opt-out/default-allow model with explicit,
versioned, granular opt-in consent for StageLink-owned analytics and PostHog.

Risk:

- Residual risk remains for third-party embeds and future analytics/marketing
  providers.

Fix:

- Keep `docs/privacy/tracking-inventory.md` updated.
- Audit third-party embeds before public privacy launch.

## High

### Provider-side DSAR automation is incomplete

Privacy Plan E3 added self-service DSAR endpoints/UI for access,
rectification, erasure, portability, consent withdrawal references, and request
logging. Provider-side deletion/revocation remains operational/manual.

Fix:

- Add WorkOS/Stripe/PostHog provider deletion runbook.
- Later automate provider deletion/revocation tasks.
- Add Behind DSAR dashboard before broad public launch.

### Admin access audit coverage is incomplete

Behind the Stage has owner/admin guards and role-change audit events, but broad
admin access to user search/detail/status/debug actions is not fully audited.

Fix:

- Add explicit audit events for Behind user search, user detail view, user
  status changes, user deletion/suspension, invitations, role changes, and
  debug-header access.
- Limit admin responses to fields that are necessary for the operator task.

### WorkOS step-up before account deletion is missing

DSAR deletion requires an authenticated session and confirmation, but there is
no WorkOS step-up/email challenge before destructive account deletion.

Fix:

- Add WorkOS step-up or an email challenge before broad public launch.
- Consider delayed deletion/grace period for consumer accounts.

### Retention is not destructively enforced yet

Raw analytics, QA/internal analytics, platform insights snapshots, Stripe
webhook idempotency records, audit logs, failed uploads, and object-storage
orphans now have a read-only candidate report, but destructive cleanup remains
disabled by design.

Fix:

- Run `pnpm data:retention:candidates` in staging and review output.
- Finalize legal retention periods and provider runbooks.
- Implement deletion/anonymization jobs only after dry-run evidence, backup
  policy, and owner approval.

### Object storage deletion is not proven end-to-end

Uploaded asset rows are scoped to artists, but the privacy program still needs
evidence that object-storage files are deleted or cleaned up when assets,
workspaces, or accounts are erased.

Fix:

- Add object deletion/orphan cleanup job.
- Test account/workspace erasure against disposable uploaded files.

### Inactive account automation lacks a local activity signal

StageLink now has an inactive-account policy, but local `users` records do not
yet have a reliable `lastActiveAt` or equivalent lifecycle signal.

Fix:

- Add local last-activity tracking before enabling inactive-account automation.
- Keep inactive deletion manual/dry-run only until notification and recovery
  windows exist.

### Provider DPA/SCC review is incomplete

Providers and transfers are listed in detail, but contracts, DPAs, SCCs,
regions, subprocessors, and retention settings are not fully confirmed in a
provider evidence register.

Fix:

- Build provider evidence register.
- Confirm each provider's region, DPA, subprocessors, and transfer safeguards.

### ROPA maintenance is not yet operationalized

The ROPA baseline covers StageLink's major processing activities, but review
triggers must be wired into product and engineering work.

Risk:

- New features, providers, analytics events, retention changes, or AI/profiling
  work may ship without updating Article 30 records.

Fix:

- Add PR/ticket privacy review prompts.
- Add quarterly ROPA and data-inventory review reminders.
- Treat `ropa.md` and `evidence-inventory.md` as required launch audit docs.

### Public/private visibility labels are incomplete

Privacy Settings and onboarding now provide clear privacy explanations, but
profile, page-builder, and EPK editing surfaces still need field-level
visibility indicators.

Risk:

- Artists may publish contact, booking, rider, or platform details without
  fully understanding where the data appears.
- Future profile fields reused across public page, EPK, and Insights may create
  accidental exposure.

Fix:

- Add `Public`, `Private`, `Public when published`, and `Used for Insights`
  labels to relevant editors.
- Add a public preview/review path before first publication.
- Mirror provider transparency copy inside individual integration settings.

### International transfer evidence is incomplete

StageLink now has an international transfer impact assessment baseline, but it
has not yet recorded provider-by-provider transfer mechanisms for active
processors and independent providers.

Risk:

- Privacy Policy claims could overstate transfer safeguards.
- EEA/UK/Swiss transfers may lack documented adequacy, SCCs, DPF certification,
  UK/Swiss addenda, or supplementary measures.
- Provider support/log/subprocessor access from third countries may be
  undocumented.

Fix:

- Complete `provider-compliance-matrix.md` evidence fields for active
  providers.
- Verify exact EU-US Data Privacy Framework entity certification before relying
  on it.
- Record UK IDTA/addendum and Swiss transfer terms where StageLink serves those
  users.
- Keep Article 49 derogations out of routine cloud transfer posture.

### Incident detection and breach operations are not fully implemented

StageLink now has a startup-ready incident response and breach notification
framework, but several detection and operational controls remain manual.

Risk:

- Breaches may be detected too late to support fast containment and GDPR
  72-hour assessment.
- Cross-tenant, admin, DSAR export, and subscriber export anomalies may not be
  visible enough.
- Provider incidents may be harder to scope without evidence contacts,
  retention, and escalation paths.

Fix:

- Configure central alerting/log drain for Critical/High signals before public
  scale.
- Add audit events for admin user search/detail views and export actions.
- Add structured denied-access signals for sensitive tenant checks.
- Create an owner-only incident registry and secure evidence storage location.
- Finalize privacy/security contact, legal escalation path, and supervisory
  authority posture.

### Production recovery capability is incomplete

Railway managed database backups/PITR are not enabled in the current Hobby plan,
and backup restoration can create privacy risk if it reintroduces deleted,
exposed, or unlawful data.

Fix:

- Enable managed backups/PITR before public launch or 100 users.
- Test restore against a disposable target.
- Add recovery checks for DSAR erasure, account deletion, tenant isolation, and
  provider-token revocation.

### Authenticated product analytics governance is incomplete

Public/visitor analytics is consent-gated, but server-side authenticated
product events still send actor user IDs to PostHog when configured.

Risk:

- Artist-user product behavior could be profiled without a final account-level
  preference, objection path, or lawful-basis decision.
- PostHog provider retention and project settings may not match the intended
  privacy posture.

Fix:

- Decide whether authenticated product analytics is consent/preference-based or
  legitimate-interests with objection handling.
- Keep product payloads minimal and avoid content, email, tokens, payment data,
  and free text.
- Confirm PostHog retention, region, person-profile, IP, autocapture, replay,
  heatmap, and export settings.

### Analytics pseudonymization and retention need hardening

StageLink avoids raw IP storage in local analytics, but `ipHash` is a stable
unsalted SHA-256 hash and raw analytics retention is not enforced.

Risk:

- Repeat-visitor inference may be possible over long retention windows.
- Raw event tables may outlive their operational purpose.
- Low-volume future breakdowns could re-identify visitor behavior.

Fix:

- Define and implement raw analytics retention/anonymization.
- Review HMAC or rotating-salt IP hash strategy.
- Add threshold rules before country, device, referrer, or segment breakdowns.

### Cross-platform StageLink Insights needs profiling transparency

Spotify, YouTube, and SoundCloud insights create a cross-platform performance
profile for an artist/account.

Risk:

- Public policy may under-disclose provider data sources, retention,
  disconnect/delete behavior, and profiling implications.
- Future AI or recommendation features could move closer to significant
  automated inference.

Fix:

- Add clear public policy/dashboard language for StageLink Insights.
- Define snapshot retention and local deletion on disconnect/account deletion.
- Run a new profiling review before recommendations, ranking, segmentation, or
  AI insight features.

### SoundCloud production posture needs a launch decision

Current SoundCloud insights use API v2 requests with a `client_id`; the provider
code notes that this API surface is undocumented and may reject server-side use.

Fix:

- Confirm official SoundCloud API permission/terms posture before public
  launch, or keep SoundCloud to public links/embeds and disable server-side
  metric sync.

### EmailJS public contact provider needs review

The public artist contact form can send visitor name/email/message content
through EmailJS from the browser. This provider was identified during the
third-party audit and needs DPA/retention/subprocessor confirmation.

Fix:

- Confirm EmailJS legal/privacy posture, or migrate public contact forms to the
  reviewed server-side email provider path.

### Fan/subscriber controller-processor role needs legal review

StageLink likely acts as processor for artist-controlled fan lists, while also
being controller for platform security/operations. This hybrid role must be
reflected correctly in policies and artist terms.

Fix:

- Decide whether artists need a DPA.
- Define subscriber DSAR routing and unsubscribe obligations.

### Age and jurisdiction need final legal approval

The recommended 18+ account policy and Argentina governing-law approach are
practical, but not final legal decisions.

Fix:

- Confirm with counsel before launch.

## Medium

### OAuth/integration scopes need privacy review

Spotify, YouTube, SoundCloud, Shopify, and merch providers expose external
account IDs, profile data, metrics, and in some cases encrypted provider tokens.

Fix:

- Minimize scopes.
- Document disconnect/delete behavior.
- Review provider terms before enabling paid/public use.
- Keep YouTube OAuth, Shopify Admin API, Printful/Printify order/customer
  scopes, and marketing pixels out of launch unless separately reviewed.

### Logs may contain personal data

Security/audit logs may include actor IDs, IPs, metadata, and operational
details.

Fix:

- Avoid secrets/PII in metadata.
- Define log retention.
- Restrict admin access.

### Application-level tenant isolation depends on endpoint discipline

The `ArtistMembership` model and `MembershipService` provide a strong API
pattern, but there is no documented PostgreSQL RLS layer. Future endpoints must
not bypass membership checks.

Fix:

- Add endpoint authorization checklist to PR reviews.
- Add cross-tenant integration tests for new private resources.
- Reconsider RLS if direct DB reporting or non-API access is introduced.

### Public content removal expectations need clarity

Published artist pages and EPKs may be cached, indexed, or shared externally.

Fix:

- Explain public-content behavior in Privacy Policy and Terms.
- Provide unpublish/delete controls.

### CCPA/CPRA sale/share analysis is incomplete

StageLink intends not to sell data, but analytics and future marketing tools
must be reviewed against sale/share definitions.

Fix:

- Document no-sale posture.
- Reassess when adding ad pixels, retargeting, or data-sharing analytics.

## Low

### Spanish translations are missing

English should remain primary legal language for launch, but Spanish
translations may improve transparency for Argentina/LatAm users.

### Periodic review cadence not set

Privacy docs should have an owner and review frequency.

Recommendation:

- Review privacy docs quarterly during active launch iteration and after every
  major data/integration change.

## Existing Technical Strengths

- WorkOS handles core authentication/session flows.
- Ownership/multi-tenant authorization was reviewed during security audit.
- Stripe webhook idempotency exists.
- Analytics store hashed IP rather than raw IP for event records.
- Subscriber model stores consent flag and consent text snapshot.
- Upload security and ownership were audited.
- Security headers, rate limiting, monitoring, and error-handling posture have
  recent audit coverage.
