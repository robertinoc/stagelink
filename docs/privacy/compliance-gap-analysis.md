# Compliance Gap Analysis

Status: baseline risk analysis for privacy legal foundations.

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

### Retention is not enforced

Raw analytics are currently documented as never automatically deleted. Other
data categories have no final retention schedule.

Fix:

- Define retention periods.
- Implement deletion/anonymization jobs.
- Document backup/cache behavior.

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
