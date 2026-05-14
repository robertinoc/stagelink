# StageLink Storage Locations

Status: Privacy Plan data-mapping baseline.
Date: 2026-05-14

## Storage Map

| Location | Data stored | Owner/operator | Persistence | Privacy notes |
| --- | --- | --- | --- | --- |
| Railway PostgreSQL | Primary app data: users, artists, memberships, pages, blocks, EPKs, analytics, subscribers, billing metadata, integrations, assets, DSAR, audit logs | StageLink/Railway | Durable | Core system of record; backups disabled on Railway Hobby at this stage |
| WorkOS AuthKit | Identity, auth methods, sessions, security/Radar data, login events | WorkOS | Provider-managed | Necessary auth/security processor; deletion/revocation requires provider workflow |
| Stripe | Customers, subscriptions, invoices, payment records, checkout/portal sessions, payment metadata | Stripe | Provider/legal retention | StageLink stores IDs/state, not full card data |
| S3-compatible object storage | Uploaded images/assets and object metadata | Storage provider | Durable | Object deletion lifecycle must be verified; public delivery URLs can be cached |
| Vercel runtime/logs | Web request metadata, deployment/build logs, environment variable references | Vercel | Provider-managed | Avoid request-body/secret logging |
| Railway runtime/logs | API request/error logs, deployment logs, environment variables | Railway | Provider-managed | Avoid token/payload logging; DB also lives here |
| PostHog | Product analytics events and browser identifiers after analytics consent | PostHog | Provider-managed | Consent-gated; retention/region must be confirmed |
| Umami | Future/possible analytics | Umami provider/self-host | Unknown/not active | Must stay consent-gated if enabled |
| Upstash Redis or in-memory rate limit store | Request counters/abuse metadata | Upstash/Railway/Vercel memory | TTL/ephemeral | Confirm production choice before public traffic |
| Browser cookies | WorkOS session/PKCE, locale, consent, analytics compatibility flag, QA cookie | User browser | Cookie TTL/session | Necessary cookies must remain independent from optional analytics consent |
| Browser localStorage/sessionStorage | PostHog identifiers after consent, possible UI state | User browser | Browser-managed | No analytics identifiers before consent |
| GitHub Actions | CI logs, artifacts, masked secret references | GitHub | Provider-managed | Artifacts should exclude auth state/secrets |
| Resend/email inbox | Contact form email payload, recipient/sender metadata | Resend/email account | Provider/inbox retention | Free text can include sensitive data |
| Provider APIs | Spotify/YouTube/SoundCloud/Shopify/Printful account data, logs, API-side state | Provider | Provider-managed | Independent terms/retention and transfer posture |

## PostgreSQL Tables

| Table | Primary data | Classification |
| --- | --- | --- |
| `users` | Account identity and deletion/suspension state | Private user data |
| `artists` | Artist profile and public/private workspace data | Tenant data, public when published |
| `artist_memberships` | Role-based tenant access | Internal/private user data |
| `pages` | Public page configuration | Tenant data |
| `blocks` | Page block content/config/localized content | Tenant data, public when published |
| `epks` | EPK content, contacts, rider/tech/location data | Tenant data, sensitive-by-context |
| `analytics_events` | Public/product engagement events with IP hashes and flags | Behavioral analytics |
| `subscribers` | Fan emails and consent evidence | Private fan data |
| `subscriptions` | Billing/subscription metadata and Stripe IDs | Financial-related |
| `stripe_webhook_events` | Stripe event IDs/types/timestamps | Financial/technical metadata |
| `custom_domains` | Artist custom domain configuration | Tenant/public technical data |
| `assets` | Upload metadata and delivery URLs | Media metadata |
| `smart_links` | Short-link labels and destinations | Tenant data, public behavior |
| `shopify_connections` | Shopify store config and storefront token | Tenant data, secret/token |
| `merch_provider_connections` | Printful/Printify token and store metadata | Tenant data, secret/token |
| `artist_platform_insights_connections` | Platform account metadata and OAuth tokens | Tenant data, secret/token |
| `artist_platform_insights_snapshots` | Provider profile/metric/top-content snapshots | Behavioral/third-party imported data |
| `dsar_requests` | Privacy request lifecycle | Privacy compliance records |
| `audit_logs` | Security/privacy/action audit trail | Internal technical metadata |

## Browser Storage

| Item | Purpose | Consent dependency | Retention |
| --- | --- | --- | --- |
| WorkOS/AuthKit cookies | Session, PKCE/state, sign-in/out | Necessary, no opt-in | Provider/session-managed |
| `NEXT_LOCALE` | Locale/routing preference | Necessary/preference | Browser/provider TTL |
| `sl_consent` | Canonical consent categories/version/timestamp | Necessary for compliance | 180 days |
| `sl_ac` | Analytics consent signal for server forwarding | Necessary for enforcement | Follows consent state |
| `sl_qa` | QA/internal analytics exclusion | Internal testing only | Manual/tester controlled |
| PostHog storage/cookies | Analytics identifiers/events | Analytics consent required | Provider/browser managed |

## Backup Position

Current operational decision:

- Railway automatic backups are disabled because the project is on the Hobby
  plan.
- Backups are deferred until public launch or approximately the first 100 users,
  when Railway Pro should be enabled.

Privacy implication:

- Backup/restore DSAR and deletion handling is not launch-ready for broad public
  traffic.
- When backups are enabled, define backup retention, restore testing, deleted
  account handling in restored backups, and access controls.

## Temporary and Shadow Storage Risks

Risk areas to review during launch hardening:

- Provider runtime logs may keep request metadata outside PostgreSQL.
- Email inboxes retain contact/support messages independently.
- Public pages/EPKs/assets may be cached by browsers, CDNs, social previews, or
  search engines.
- Playwright/GitHub artifacts can accidentally store screenshots/videos of
  private dashboard data.
- Object storage may retain orphaned files if DB rows are deleted without an
  object deletion job.
