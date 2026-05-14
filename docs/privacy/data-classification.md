# StageLink Data Classification

Status: Privacy Plan data-mapping baseline.
Date: 2026-05-14

## Classification Labels

| Label | Meaning | Handling expectation |
| --- | --- | --- |
| Public | Intended to be visible on public pages, EPKs, or shared links | Publish only after user action; easy unpublish/edit controls |
| Private user data | Account/user data not intended for public display | Authenticated access only; DSAR export/rectification coverage |
| Tenant data | Data scoped to an artist workspace | Enforce membership/role checks for all reads/writes |
| Behavioral analytics | Usage, click, page-view, product, or insights behavior | Consent gate where non-essential; minimize identifiers |
| Financial-related | Billing/subscription/payment metadata | Strict access, Stripe retention/legal review |
| Secret/token | OAuth/API/storefront tokens, provider keys, session material | Never expose in UI, logs, exports, or public APIs |
| Technical metadata | IP hashes, user agents, object keys, timestamps, IDs, logs | Retention limits; avoid raw PII in logs |
| Sensitive-by-context | Not special-category by default, but risky because it may reveal bookings, location, fans, or minors | Extra minimization and publication clarity |

## Field-Level Classification

| Data area | Examples | Classification | GDPR relevance | Public/private | Risk |
| --- | --- | --- | --- | --- | --- |
| Account identity | email, first/last name, WorkOS ID, avatar URL | Private user data | Personal data | Private | High |
| Auth sessions/security | WorkOS sessions, Radar decisions, auth methods, MFA posture | Technical metadata, private user data | Personal data/security metadata | Private/provider | High |
| Artist profile | display name, username, bio, categories, social URLs | Tenant data, public when published | Personal data where person-identifying | Mixed | High |
| Artist contact | contact email, booking email, management/press contact | Private or public user-provided contact data | Personal data | Mixed | High |
| EPK rider/requirements | rider info, tech requirements, availability, location | Sensitive-by-context tenant data | Personal data possible; business confidential | Mixed | High |
| Page blocks | text, links, embeds, forms, merch, galleries | Tenant data, public when published | Personal data possible | Mixed | Medium |
| Subscriber records | fan email, consent text, source page, locale, IP hash | Private user/fan data, tenant data | Personal data; consent evidence | Private to artist | High |
| Analytics events | page views, link clicks, IP hash, device/country, consent flag | Behavioral analytics, technical metadata | Personal data/pseudonymous data | Private dashboard | Medium/High |
| PostHog | product events, identifiers, paths, properties | Behavioral analytics | Personal data/pseudonymous data | Provider/internal | High |
| Stripe metadata | customer/subscription IDs, event IDs, billing state | Financial-related | Personal data/payment metadata | Private/provider | High |
| OAuth/provider tokens | access/refresh tokens, scopes | Secret/token | High-risk account access material | Private only | Critical |
| Platform insights | external account IDs, handles, metrics snapshots, top content | Tenant data, third-party imported data | Personal/business data possible | Private dashboard | High |
| Shopify/merch settings | store domain, storefront token, provider API token | Secret/token, tenant data | Business/personal data possible | Mixed | Critical for tokens |
| Assets | image files, filenames, object keys, delivery URLs | Public/private media, technical metadata | Personal data possible | Mixed | High |
| DSAR records | request type/status/metadata, completion timestamps | Privacy compliance records | Personal data/compliance evidence | Internal | Medium |
| Audit logs | actor ID, action, entity ID, metadata, IP address | Technical metadata, private user data | Personal data | Internal | High |
| Runtime logs | route/status/IP/user-agent/errors | Technical metadata | Personal data possible | Provider/internal | High |
| Contact form | name, email, artist type, message | Private support/contact data | Personal data; sensitive data possible in free text | Internal | High |
| Consent cookies | consent categories, timestamp, version | Technical/privacy preference data | Personal data if linkable | Browser-local | Medium |

## Sensitive Data Boundary

StageLink does not intentionally collect GDPR special-category data as a core
feature. However, user-generated content can include sensitive information
without StageLink prompting for it. Higher-risk areas:

- biographies and full bios;
- EPK rider, technical requirements, availability, and location;
- contact/support message free text;
- uploaded images;
- fan/subscriber association with a specific artist;
- analytics that can infer audience behavior.

Operational rule: do not create features that encourage health, political,
religious, biometric, sexual-orientation, union, or precise-location data unless
the Privacy Policy, consent, and controls are redesigned.

## Public vs Private Rules

| Rule | Required control |
| --- | --- |
| Artist profile/page/EPK content starts private by default | Publish toggles and clear preview/live distinction |
| Contact emails may become public | UI copy should make publication obvious |
| Fan/subscriber data is never public | Artist-scoped dashboard only; export/delete controls |
| Analytics dashboards are private | Membership and plan checks |
| Tokens are always private | Redaction in export, logs, audit metadata, and UI |
| Assets can become public | Public delivery URL only after intended use; deletion/disconnect coverage |

## Risk Levels

Critical:

- OAuth access/refresh tokens.
- Merch provider API tokens.
- WorkOS/API/Stripe/server secrets.
- Any accidental token exposure in logs, exports, public APIs, or client bundles.

High:

- User emails and WorkOS identity links.
- Fan subscriber emails and consent evidence.
- Billing/customer identifiers.
- EPK booking/management/location/rider data.
- Raw audit/runtime logs containing IPs or request details.

Medium:

- Public analytics event rows with hashed IP.
- Public profile text and images after publication.
- Object keys and filenames.
- Consent cookie state.

Low:

- Aggregated metrics with no direct identifiers.
- Non-identifying static public marketing content.
