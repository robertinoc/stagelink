# Privacy Policy Structure

Status: professional structure and StageLink-specific content requirements. This
is not final policy copy.

## Required Sections

### 1. Introduction

Explain:

- StageLink is a platform for artists, DJs, musicians, and creators to publish
  profiles, EPKs, links, media, merch, and analytics.
- The policy applies to account users, artists/team members, public visitors,
  fans who submit forms, and business contacts.
- StageLink's legal entity and contact details.

TODO legal review: insert final legal entity, address, and privacy contact.

### 2. StageLink's Role

State:

- StageLink is controller for platform accounts, billing, security, analytics,
  support, and platform operations.
- For artist fan/subscriber lists, the artist may be controller and StageLink
  may process data on the artist's behalf.
- StageLink remains controller for security, fraud prevention, and service
  operations.

### 3. Data We Collect

Break down by source:

- Data provided by users: account info, artist profile, EPK, public content,
  contact emails, uploaded assets.
- Data from fans/public visitors: email capture, contact forms, page/link events,
  device/country, hashed IP.
- Data from integrations: Spotify/YouTube/SoundCloud/Shopify/merch provider data.
- Data from payments: Stripe customer/subscription IDs and billing state.
- Data from automatic collection: cookies, analytics, logs, security events.
- Data from support/admin workflows.

### 4. How We Use Data

Map purposes:

- Provide, secure, and maintain accounts.
- Publish artist pages and EPKs.
- Process subscriptions and payments.
- Provide analytics dashboards.
- Operate integrations.
- Send service messages and user-requested communications.
- Prevent abuse, fraud, and security incidents.
- Provide support and improve StageLink.
- Comply with legal obligations.

### 5. Legal Bases

For GDPR users, disclose:

- Contract: account, profiles, EPKs, billing, integrations.
- Legitimate interests: security, abuse prevention, limited operational analytics,
  product reliability.
- Consent: non-essential cookies/analytics, marketing, email capture where
  applicable, OAuth authorization.
- Legal obligation: accounting, tax, compliance, incident response.

### 6. Public Content

Explain:

- Artist pages, EPKs, links, images, biographies, media, and selected contact
  information may be public when published.
- Users are responsible for rights and permissions in uploaded/published content.
- Removing content from StageLink may not remove third-party copies, search
  engine caches, or previously shared links immediately.

### 7. Fan/Subscriber Data

Explain:

- Fans may submit email addresses to artists through StageLink blocks.
- Artists may use those lists subject to their own legal responsibilities.
- StageLink stores consent text and metadata to support consent records.
- Fans should have an unsubscribe/deletion contact path.

TODO implementation: define whether subscriber DSARs go to StageLink, artist, or
both.

### 8. Cookies and Analytics

Reference Cookie Policy and disclose:

- Strictly necessary cookies for auth/session/localization/security.
- Analytics cookies/events and consent handling.
- PostHog/Umami use if active.
- How visitors can change choices.
- Global Privacy Control / DNT support if implemented.

Current gap: current analytics documentation describes opt-out/default allow for
some analytics. GDPR launch should move non-essential analytics to opt-in.

### 9. Sharing and Providers

Disclose provider categories:

- Auth provider
- Payment processor
- Hosting/database/storage
- Analytics provider
- Email provider
- Third-party integrations selected by users
- Legal/compliance/safety providers if needed

State that StageLink does not sell personal information as a product feature.
TODO legal review: validate CCPA/CPRA sale/share status for analytics.

### 10. International Transfers

Explain:

- Data may be processed in countries outside the user's location.
- StageLink uses contractual and technical safeguards where required.
- DPAs/SCCs or comparable mechanisms apply where appropriate.

### 11. Retention

Disclose retention by category:

- Account/profile data.
- Public content/assets.
- Subscriber lists.
- Analytics events.
- Billing records.
- Security/audit logs.
- Integration tokens.

TODO: insert final periods after retention workstream.

### 12. User Rights

Cover:

- Access/export.
- Correction.
- Deletion.
- Restriction/objection.
- Portability.
- Withdraw consent.
- Opt out of marketing.
- CCPA/CPRA rights where applicable.
- Argentina access/rectification/update/deletion rights.

TODO implementation: define DSAR intake email, identity verification, SLA, and
logging.

### 13. Security

Summarize:

- HTTPS.
- WorkOS-managed auth/session.
- Role/ownership checks.
- Audit logging.
- Rate limiting/anti-abuse controls.
- Upload controls.
- Provider secrets management.

Avoid overpromising; do not claim "fully secure".

### 14. Children

State:

- StageLink accounts are for users 18+ unless future legal review creates a
  guardian-consent workflow.
- StageLink is not directed to children under 13.
- Users should contact StageLink if child data was submitted.

### 15. Changes to the Policy

Explain:

- StageLink may update the policy.
- Material changes will be communicated through appropriate channels.
- Effective date and version history.

### 16. Contact

Include:

- Privacy contact email.
- Legal entity/address.
- Data protection contact if appointed.
- DSAR contact path.

TODO legal review: decide whether a DPO or EU representative is required.
