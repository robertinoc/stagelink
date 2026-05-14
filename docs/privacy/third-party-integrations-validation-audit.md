# Third-Party and Integrations Validation Audit

Status: validation audit for Privacy Plan third-party/integrations work.
Date: 2026-05-14

Scope reviewed:

- `docs/privacy/integrations-inventory.md`
- `docs/privacy/external-data-flows.md`
- `docs/privacy/oauth-architecture.md`
- `docs/privacy/api-scope-review.md`
- `docs/privacy/provider-compliance-matrix.md`
- `docs/privacy/third-party-processors.md`
- `docs/privacy/providers-and-transfers.md`
- `docs/privacy/third-party-risk-analysis.md`
- relevant integration/security docs and source references

This is not legal advice. It is a strict privacy engineering validation of the
documentation and architecture posture.

## 1. Third-Party Inventory Audit

Result: mostly complete for the current repository.

Strong coverage:

- WorkOS, Vercel, Railway, PostgreSQL, object storage, Stripe, PostHog,
  Upstash, Resend, EmailJS, Spotify, YouTube, SoundCloud, Shopify, Printful,
  Printify, GitHub Actions, and public embeds are identified.
- Active, optional, and future providers are separated.
- Browser-side and embed-related exposure is included.

Gap:

- final object-storage provider is still generic (`S3/R2-compatible`);
- provider subprocessors are not copied into a local evidence register;
- EmailJS was underrepresented in earlier privacy docs and is now flagged.

Severity: High until provider evidence is completed.

## 2. Data Flow Audit

Result: operationally useful.

Strong coverage:

- auth, billing, analytics, music insights, merch, contact, storage, embeds,
  and CI/CD flows are documented;
- outbound/inbound data is identified;
- storage implications are documented.

Gap:

- provider-side log retention and support-access flows are still unknown;
- public embed cookie behavior requires browser/network validation.

Severity: Medium.

## 3. API Terms Compliance Audit

Result: improved, but not fully launch-cleared.

Positive findings:

- Spotify is documented as Client Credentials/public-artist data only.
- YouTube is documented as API-key/public-channel data only.
- Google/YouTube OAuth is explicitly gated behind a future review.
- Shopify is constrained to Storefront reads.
- Printful is constrained to store/product reads.

Concern:

- SoundCloud remains the most fragile provider because current server-side API
  v2 usage needs official permission/terms acceptance before broad public use.
- YouTube/Google policies are strict if OAuth/authorized data is added later.

Severity: High.

## 4. OAuth Architecture Audit

Result: good current posture, stricter future gates needed.

Strong coverage:

- current Spotify and YouTube flows avoid user OAuth tokens;
- Shopify/Printful tokens are correctly classified as artist-supplied API
  tokens rather than OAuth;
- token storage rules and future OAuth gate are documented.

Gap:

- WorkOS/provider-side session revocation and deletion remain manual runbook
  items;
- there is no implemented Google/YouTube OAuth revocation because OAuth is not
  active.

Severity: Medium for current launch, High if OAuth is introduced.

## 5. API Scope Audit

Result: acceptable for current launch if documented decisions are enforced.

No confirmed excessive active OAuth scopes were found. The key risk is future
scope creep, especially:

- YouTube owner analytics/write scopes;
- Shopify Admin API;
- Printful/Printify order/customer scopes;
- analytics session replay/autocapture;
- marketing pixels.

Severity: Medium.

## 6. GDPR Compliance Audit

Result: documentation-ready, evidence-incomplete.

The docs now identify roles and transfer implications, but StageLink still
needs the provider evidence register:

- DPA/contract links or signed agreements;
- subprocessors;
- SCC/transfer mechanisms;
- production region;
- retention settings;
- provider DSAR/deletion channel.

Severity: High before public launch.

## 7. Controller/Processor Relationship Audit

Result: legally coherent, but final counsel review required.

Good:

- WorkOS/Vercel/Railway/PostHog/Resend/storage are treated primarily as
  processors for StageLink-controlled processing;
- Stripe, Spotify, YouTube/Google, SoundCloud, Shopify, Printful are treated
  carefully as independent providers/controllers in important contexts;
- StageLink avoids claiming it can delete/control provider-side data it does
  not control.

Gap:

- final public policy must describe fan/subscriber and artist-owned contact
  data responsibilities clearly.

Severity: Medium.

## 8. Third-Party Analytics Audit

Result: good for StageLink-owned analytics; embeds still need follow-up.

Good:

- PostHog browser analytics is consent-gated;
- Umami is documented as not active;
- analytics must not include raw email, tokens, payment data, or message
  content.

Gap:

- public embeds can still create third-party tracking outside StageLink-owned
  analytics controls.

Severity: High for embed review, Medium overall.

## 9. Public Exposure Audit

Result: documented and actionable.

Public artist pages and EPKs intentionally expose artist-provided content,
social links, merch links, and embed URLs. The main privacy obligations are:

- transparency that public pages are public/indexable/shareable;
- controls to unpublish/delete;
- no accidental exposure of private tokens or internal IDs;
- click-to-load review for embeds that set cookies.

Severity: Medium.

## 10. Documentation Audit

Result: strong practical documentation.

The docs are maintainable and engineering-useful. They now give concrete
provider-by-provider decisions instead of generic privacy wording.

Remaining need:

- add provider evidence register values as operational facts become known.

Severity: Low.

## Risk Assessment

### Critical

None confirmed in this phase.

### High

- Provider evidence register incomplete for public launch.
- SoundCloud server-side API posture needs official confirmation or downgrade.
- EmailJS contact-form provider legal/DPA/retention review incomplete.
- YouTube/Google OAuth would be high-risk if added without a separate review.
- Public embeds may track before user interaction.

### Medium

- Stripe retention/DSAR boundary needs final public policy language.
- PostHog region/retention/IP settings not captured.
- Object storage provider/region/lifecycle not captured.
- Shopify/Printful token rotation guidance missing from UX/docs.
- CI/CD artifacts can leak personal data if real test data is used.

### Low

- Umami mentioned as possible/future but not active.
- Printify exists as future enum/provider but is not implemented.

## Integration Compliance Readiness Score

Overall score: 78/100.

Breakdown:

| Category | Score | Notes |
| --- | ---: | --- |
| Inventory completeness | 86 | Good provider coverage, object storage still generic |
| Data-flow clarity | 84 | Useful operational flows, provider logs/embeds need validation |
| API scope posture | 82 | Good current least-privilege posture, future scope gate needed |
| OAuth/token safety | 80 | Current OAuth minimized; token runbooks need completion |
| Provider evidence | 55 | DPAs/SCCs/regions/retention not fully evidenced |
| Analytics/embed privacy | 74 | PostHog consent good; embeds need click-to-load review |
| Launch operational readiness | 72 | Needs evidence register and SoundCloud/EmailJS decisions |

## Production Blockers

These block "privacy-complete public launch", not private QA:

1. Complete provider evidence register for active processors.
2. Decide SoundCloud production posture.
3. Confirm EmailJS DPA/retention/subprocessor posture or replace it.
4. Confirm object-storage provider, region, lifecycle, and deletion behavior.
5. Confirm PostHog region/retention/IP/autocapture/session-recording settings.
6. Update public Privacy Policy/Cookie Policy with active providers only.

## Final Recommendations

Immediate:

- add provider evidence register as a launch checklist artifact;
- treat SoundCloud and EmailJS as explicit launch decisions;
- keep YouTube OAuth out of launch unless a separate review is completed;
- confirm storage and PostHog operational settings.

Can wait:

- automated provider monitoring;
- vendor-risk dashboard;
- Google/YouTube annual security assessment, unless OAuth/sensitive scopes are
  introduced.

Overengineered areas:

- no need for enterprise GRC tooling yet; a maintained evidence register is
  enough for the current StageLink stage.

Missing controls:

- click-to-load/embed privacy review;
- provider-side DSAR/deletion runbooks;
- formal provider review cadence with owner/date fields.
