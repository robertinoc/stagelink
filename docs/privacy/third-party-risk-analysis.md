# Third-Party Privacy Risk Analysis

Status: Privacy Plan - third-party and integrations baseline.
Date: 2026-05-14

## Critical Risks

No critical code-level third-party privacy blocker was confirmed in this
documentation-only phase. However, public launch should not proceed as
"privacy complete" until the high-risk operational items below are closed or
accepted explicitly.

## High Risks

### H1 - Provider DPA/SCC/region evidence is incomplete

StageLink has identified its providers, but the evidence register is not yet
complete for DPAs, subprocessors, transfer mechanisms, production regions, and
retention periods.

Impact:

- weak accountability posture under GDPR;
- incomplete public Privacy Policy disclosures;
- difficult incident/DSAR provider handling.

Fix:

- complete `provider-compliance-matrix.md` with evidence URLs, account plans,
  regions, retention settings, and review dates.

### H2 - SoundCloud integration is policy-fragile

The current SoundCloud provider uses API v2 endpoints and browser-like headers.
The code itself notes that this surface is undocumented and may change or reject
server-side use.

Impact:

- provider terms/policy risk;
- unstable production behavior;
- possible need to remove stored SoundCloud-derived metrics.

Fix:

- confirm official SoundCloud API permission/terms posture, or restrict
  SoundCloud to public links/embeds until official access is clear.

### H3 - EmailJS public contact form provider needs review

EmailJS runs from the browser and processes visitor name/email/message content.
Its public keys are not secrets, but it is still an external processor/vendor
for contact content.

Impact:

- contact-form messages leave StageLink directly from the visitor browser;
- provider DPA/retention/subprocessor posture is not captured;
- harder to enforce centralized abuse logging and DSAR handling.

Fix:

- confirm EmailJS legal posture or migrate public contact forms to the existing
  server-side email pattern with Resend or another reviewed email provider.

### H4 - YouTube OAuth must not be added casually

Current YouTube use is API-key public channel data. If StageLink adds owner-only
YouTube Analytics, Google/YouTube scope, revocation, deletion, and security
assessment obligations become stricter.

Impact:

- overbroad scopes could violate least-privilege requirements;
- authorized data must be revocable/deletable;
- policy and verification work may block launch.

Fix:

- keep launch posture API-key/public-data only;
- open a separate privacy/security review before adding YouTube OAuth.

### H5 - Public embeds may create third-party tracking before interaction

Music/video embeds and social providers can set third-party cookies or collect
browser metadata when loaded.

Impact:

- consent promises may be weakened if embeds track before user interaction;
- provider-side tracking may be hard to inventory.

Fix:

- audit embed renderers in the next cookie/privacy UI pass;
- add click-to-load placeholders for providers that set non-essential cookies
  before user action.

## Medium Risks

### M1 - Stripe retention and DSAR boundaries need final policy wording

Stripe payment records should not be deleted incorrectly if needed for tax,
accounting, fraud, disputes, refunds, or legal obligations.

Fix:

- policy wording must clearly say Stripe may retain payment information under
  its own obligations and that StageLink stores only billing references/state.

### M2 - PostHog provider settings are not fully captured

PostHog is consent-gated, but project region, retention, IP handling, and DPA
evidence are not stored in the repo.

Fix:

- capture project region, retention settings, autocapture/session-recording
  status, and DPA/subprocessor evidence.

### M3 - Object storage provider details remain generic

Docs refer to S3/R2-compatible storage, but final provider, region, lifecycle,
and DPA evidence are not captured.

Fix:

- record provider, bucket region, public/private ACL, CDN domain, deletion
  behavior, and lifecycle rules.

### M4 - Shopify/Printful tokens need operational rotation guidance

Tokens are encrypted at rest, but artist-facing rotation and least-privilege
guidance is not yet documented in product UX.

Fix:

- add support/docs copy explaining what tokens to create, how to rotate them,
  and how to disconnect.

### M5 - CI/CD artifacts can leak personal data

E2E screenshots/videos and logs can contain personal data if test users or real
accounts are used.

Fix:

- keep test accounts synthetic;
- keep artifacts short-lived;
- do not upload auth setup artifacts or unmasked storage.

## Low Risks

### L1 - Umami is mentioned as possible/future but not active

This is manageable as long as public policy does not claim Umami is active
unless it is actually enabled.

### L2 - Printify exists as a future enum/provider

This is low risk until implemented, but must trigger a full scope/provider
review before activation.

## Operational Recommendations

1. Build a simple provider evidence register before public launch.
2. Keep OAuth use minimal and public-data based for launch.
3. Treat SoundCloud server-side sync as a go/no-go launch decision.
4. Decide whether EmailJS remains, or consolidate public contact forms behind
   a server-side reviewed email provider.
5. Confirm object storage provider/region/lifecycle.
6. Add "new provider review" to PR checklist.
7. Add a quarterly provider review cadence.
8. Update public Privacy Policy and Cookie Policy with only active providers.

## Future TODOs

- Automated provider evidence register checks.
- Automated env-to-provider inventory report.
- OAuth token revocation monitoring.
- Provider DPA/subprocessor change notifications.
- Click-to-load third-party embed privacy mode.
- Vendor-risk dashboard in Behind.
- Annual Google/YouTube API compliance re-review if OAuth is introduced.
