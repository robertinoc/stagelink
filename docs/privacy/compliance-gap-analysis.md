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

### Non-essential analytics consent is not GDPR-ready

Existing analytics documentation describes an opt-out/default-allow model for
basic analytics and PostHog gating based on the `sl_ac` cookie. For EU/ePrivacy
readiness, non-essential analytics and third-party tracking should not run before
opt-in consent.

Risk:

- EU consent non-compliance.
- Weak cookie transparency.
- Difficult defense if tracking grows beyond strictly necessary metrics.

Fix:

- Implement granular consent categories.
- Block PostHog/non-essential analytics before opt-in where required.
- Store consent category, timestamp, and policy version.

## High

### DSAR process is not defined

Access, export, correction, deletion, portability, and consent-withdrawal
processes are not yet documented end-to-end.

Fix:

- Create manual DSAR SOP first.
- Later build self-service export/delete UI and endpoints.

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
