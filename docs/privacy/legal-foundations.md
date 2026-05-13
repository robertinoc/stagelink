# StageLink Legal Foundations

Status: baseline recommendation; requires legal review before production
scaling.

## 1. Legal Role

StageLink should be treated as a hybrid privacy actor:

- Primary role: Data Controller for the core platform.
- Limited role: Data Processor where StageLink processes fan/subscriber data
  on behalf of artists using email capture, booking/contact, or audience-list
  features.
- Independent controller role: StageLink remains an independent controller for
  platform operations such as authentication, billing, fraud prevention,
  security logs, product analytics, customer support, and legal compliance.

### Why StageLink Is Primarily a Controller

StageLink determines the purposes and means for core processing:

- Account creation and authentication through WorkOS.
- Artist profile and EPK hosting.
- Public page publishing and routing.
- Billing and subscription management.
- Platform analytics dashboards and quality filtering.
- Security monitoring, rate limiting, audit logging, and abuse prevention.
- Product communication, onboarding, and support.

These are StageLink-defined platform purposes, so StageLink should not describe
itself only as a processor.

### Where StageLink May Be a Processor

For artist-owned audience data, the role is more nuanced. When an artist uses
StageLink to collect fan emails through an email capture block, the artist may
decide the purpose of that collection. StageLink stores the data, enforces
consent capture fields, and provides the infrastructure.

Recommended position:

- Artist is controller for their fan/subscriber list and subsequent outreach.
- StageLink is processor for storing and displaying that artist-specific fan
  list.
- StageLink is independent controller for security, deduplication, platform
  abuse prevention, service operation, and legal obligations related to that
  same event.

TODO legal review: decide whether StageLink will offer a Data Processing
Addendum (DPA) to artists for fan/subscriber data.

## 2. Applicable Regulations

### GDPR and ePrivacy

GDPR should be treated as the leading compliance baseline because StageLink is a
global SaaS product that may offer services to EU users and may monitor
behavior through analytics. Relevant GDPR concepts include:

- Controller/processor role classification.
- Lawful basis for each processing purpose.
- Transparency and privacy notice obligations.
- Data subject rights.
- International data transfer safeguards.
- Processor/subprocessor governance.
- Data minimization, purpose limitation, storage limitation, and security.

Cookie and tracking behavior also requires attention under EU ePrivacy-style
rules. Non-essential analytics or marketing cookies should use opt-in consent
for EU users.

### CCPA/CPRA

California privacy law should be treated as a readiness requirement, even if
StageLink may not yet meet all statutory thresholds. StageLink should still
prepare for:

- Notice at collection.
- Right to know/access.
- Right to delete.
- Right to correct.
- Right to opt out of sale/share, if StageLink ever shares data in a regulated
  way.
- Sensitive personal information analysis.
- Service-provider/contractor terms for vendors.

Current recommendation: state that StageLink does not sell personal information
unless legal review finds a third-party analytics or advertising use that
qualifies as sale/share.

### Argentina Ley 25.326

StageLink should account for Argentina's personal data protection law because
the business/operator context includes Argentina and the platform may process
data of Argentina residents. Relevant operational expectations:

- Personal data must be collected for defined purposes.
- Processing should be transparent and proportionate.
- Users should have access, correction, and deletion rights.
- Security and confidentiality obligations should be documented.
- International transfer and database registration obligations require legal
  review based on the final operating entity.

### Future Considerations

LGPD (Brazil) and PIPEDA (Canada) are not launch blockers for the baseline, but
the GDPR-first approach maps well to both:

- Legal basis/purpose mapping.
- User rights workflow.
- Provider inventory.
- Retention and deletion controls.
- Breach response documentation.

## 3. Lawful Basis Mapping

| Processing activity | Data categories | GDPR lawful basis | Purpose | Necessity | Retention rationale |
| --- | --- | --- | --- | --- | --- |
| Account creation and authentication | Name, email, WorkOS ID, session metadata | Contract; legitimate interests for security | Create and secure user accounts | Required to operate the service | Active account life plus limited post-deletion/legal retention |
| Artist profile and public page | Display name, bio, category, images, social links, public URLs, contact email | Contract | Publish artist pages and EPKs at user's direction | Required for StageLink's core service | Until user edits/deletes profile or account retention window ends |
| EPK and booking/contact content | Booking email, management contact, press contact, rider info, tech requirements, availability | Contract | Build and publish artist press/booking material | Required when artist uses EPK features | Until deleted by artist; export/delete policy needed |
| Fan/subscriber capture | Fan email, consent flag/text, source block, locale, IP hash | Consent for fan communication; legitimate interests for security/deduplication | Let fans subscribe to an artist's updates and preserve proof of consent | Required to run email capture blocks | Until unsubscribe/deletion request or artist deletes list; retention policy needed |
| Public analytics | Page views, link clicks, device/country, IP hash, consent flag, QA/bot flags | Legitimate interests for strictly limited aggregate metrics; consent for non-essential analytics/cookies | Provide artists with engagement metrics and product diagnostics | Useful to platform and artists, but not all tracking is essential | Raw event retention currently indefinite; retention limit needed |
| PostHog/product analytics | Client events, product usage, anonymous or pseudonymous identifiers | Consent for non-essential tracking in EU; legitimate interests may apply to minimal operational analytics | Improve product, detect issues, understand usage | Not strictly required for service delivery | Define retention in PostHog and policy |
| Payments and subscriptions | Stripe customer ID, subscription IDs, plan, status, billing events | Contract; legal obligation; legitimate interests for fraud prevention | Process paid plans and maintain billing state | Required for PRO/PRO+ | Per tax/accounting/legal obligations; final period needs legal review |
| Platform integrations | Spotify/YouTube/SoundCloud handles/URLs, tokens when OAuth is used, external account IDs, metrics snapshots | Contract; consent for OAuth authorization where applicable | Connect artist services and show insights | Required only for chosen integrations | Until disconnected plus limited operational retention |
| Shopify/merch integrations | Store domain, storefront token, selected products, provider API token | Contract | Render merch/storefront features | Required only for chosen integrations | Until disconnected; token deletion policy needed |
| Uploaded assets | File name, MIME type, size, object key, delivery URL, creator ID | Contract; legitimate interests for abuse prevention | Host artist images/assets | Required for profile/EPK/gallery features | Until deleted by artist/account; backup/cache retention to define |
| Security/audit logs | Actor ID, action, entity, metadata, IP address or hash | Legitimate interests; legal obligation where applicable | Detect abuse, investigate incidents, prove changes | Required for security posture | 12-24 months recommended; final period to define |
| Marketing communications | Email, preferences, campaign metadata | Consent; legitimate interests for limited customer communications where allowed | Product announcements and onboarding | Not required for core service | Until opt-out or account deletion; suppression list retained as needed |
| Support/admin operations | Email, account details, user messages, admin actions | Contract; legitimate interests | Resolve user requests and operate Behind/admin tooling | Required for support | Ticket lifecycle plus legal/security retention |

## 4. Minimum Age Policy

Recommendation: StageLink account creators must be at least 18 years old.

Rationale:

- Artists can publish public pages, collect audience emails, connect services,
  and potentially use paid subscriptions.
- A clean 18+ account rule reduces contract-capacity and parental-consent
  complexity.
- StageLink is not designed for children and should not knowingly collect data
  from children under 13.

Optional future path: allow users aged 16-17 only with verifiable guardian
consent and region-specific legal review.

Public visitors may include younger fans, but StageLink should avoid
child-directed language, avoid intentional collection of children's data, and
include an under-13 deletion contact path.

## 5. Jurisdiction Approach

Recommended baseline:

- Governing law: Argentina, subject to legal review based on final operating
  entity.
- Venue/disputes: courts of the operator's chosen jurisdiction, subject to
  mandatory consumer and privacy rights that cannot be waived.
- International users: terms must state that users may have mandatory local
  rights under privacy, consumer, and data protection law.

TODO legal review:

- Confirm the legal entity that operates StageLink.
- Confirm whether Argentina or another jurisdiction should govern commercial
  terms.
- Confirm consumer-law implications for EU/UK/California users.
- Confirm whether paid plans need region-specific billing/tax language.

## 6. Launch Position

StageLink can use this document as the privacy/legal architecture baseline, but
should not treat it as final compliance. Before public launch or paid growth:

- Finalize Privacy Policy, Terms of Service, and Cookie Policy.
- Implement GDPR-compatible consent for non-essential cookies/analytics.
- Define DSAR export/delete/correction process.
- Define retention periods and deletion/anonymization workflows.
- Review provider DPAs and international transfer safeguards.
- Approve age, jurisdiction, and fan-subscriber controller/processor language
  with counsel.
