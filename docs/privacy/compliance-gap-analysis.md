# Compliance Gap Analysis

Status: baseline risk analysis for privacy legal foundations, consent, DSAR,
data mapping, Privacy-by-Design, and retention/lifecycle governance.

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

Providers and transfers are listed, but contracts, DPAs, SCCs, regions, and
retention settings are not confirmed.

Fix:

- Build provider evidence register.
- Confirm each provider's region, DPA, subprocessors, and transfer safeguards.

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

Spotify, YouTube, SoundCloud, Shopify, and merch providers may expose tokens,
external account IDs, profile data, and metrics.

Fix:

- Minimize scopes.
- Document disconnect/delete behavior.
- Review provider terms before enabling paid/public use.

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
