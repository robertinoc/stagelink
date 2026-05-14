# StageLink Data Inventory

Status: Privacy Plan data-mapping baseline.
Date: 2026-05-14
Scope: real application data observed in the current repository, Prisma schema,
privacy/consent/DSAR implementation, and documented infrastructure.

This is a living operational inventory. Every new feature that collects,
imports, stores, exports, logs, or displays data must update this file and the
linked privacy mapping documents.

## Inventory Summary

| Domain | Primary source | Main storage | User-facing state | Privacy risk |
| --- | --- | --- | --- | --- |
| Account identity | WorkOS AuthKit, signup/login flows | WorkOS, `users` | Private account data | High |
| Artist workspace/profile | Onboarding, dashboard profile editor | PostgreSQL `artists`, `artist_memberships` | Private draft, public when published | High |
| Public page content | Dashboard page editor | PostgreSQL `pages`, `blocks`, CDN/browser render | Public when published | Medium |
| EPK content | EPK editor | PostgreSQL `epks`, asset storage | Private draft, public when published | High |
| Fan/subscriber data | Public email capture blocks | PostgreSQL `subscribers` | Private to artist workspace | High |
| Public analytics | Public pages, links, smart links, email capture | PostgreSQL `analytics_events`, PostHog when consented | Private artist dashboard | Medium/High |
| Platform insights | Spotify, YouTube, SoundCloud references/sync | PostgreSQL insights tables, provider APIs | Private artist dashboard | High |
| Payments/subscriptions | Stripe Checkout, Portal, webhooks | Stripe, PostgreSQL `subscriptions`, `stripe_webhook_events` | Private billing/admin state | High |
| Uploads/assets | Upload intent + S3-compatible storage | PostgreSQL `assets`, object storage/CDN | Private or public depending placement | High |
| Merch/store integrations | Shopify, Printful/Printify settings | PostgreSQL integration tables, external APIs | Private settings, public product display | High |
| DSAR/privacy records | Privacy settings/endpoints | PostgreSQL `dsar_requests`, `audit_logs`, browser consent cookie | Private/internal | Medium |
| Security/audit logs | Sensitive backend actions | PostgreSQL `audit_logs`, Vercel/Railway logs | Internal only | High |
| Landing/support contact | Marketing contact form | Resend/email inbox, runtime logs on errors | Internal only | High |
| Browser consent/storage | Consent manager, locale/auth/tracking | Cookies/localStorage/sessionStorage | Browser-local | Medium |

## Data Categories

### Account Identity

Representative fields:

- `users.id`
- `users.workos_id`
- `users.email`
- `users.first_name`
- `users.last_name`
- `users.avatar_url`
- `users.is_suspended`
- `users.deleted_at`
- created/updated timestamps
- WorkOS auth methods, sessions, security events, Radar decisions

Source:

- WorkOS AuthKit login/signup/callback flow.
- Local account provisioning in the API after authentication.
- DSAR rectification endpoint for first/last name.

Purpose:

- Authenticate users.
- Link WorkOS identity to StageLink account and memberships.
- Enforce access control, suspension, deletion, and auditability.

Legal basis:

- Contract for account creation and platform access.
- Legitimate interests for security, abuse prevention, and audit logs.
- Legal obligation where retention is needed for billing/security disputes.

Retention:

- Active account lifetime.
- On account deletion, local user row is anonymized and suspended.
- WorkOS-side retention/deletion remains an operational follow-up.

Notes:

- Direct personal data. Treat `email` and WorkOS identifiers as private.
- `workos_id` is pseudonymous but linkable to an identifiable person.

### Artist Workspace and Profile Data

Representative fields:

- `artists.username`
- `artists.display_name`
- `artists.bio`
- `artists.full_bio`
- categories, tags, record labels
- avatar, cover, gallery image URLs
- social/media/profile URLs
- contact email
- streaming/store URLs
- SEO title/description
- base locale and translations
- `artist_memberships.role`

Source:

- Onboarding.
- Dashboard profile/page/settings editors.
- Imported or referenced external profile URLs entered by the user.

Purpose:

- Create and manage artist workspaces.
- Publish public artist pages.
- Support team/role-based access control.

Legal basis:

- Contract for providing the StageLink service.
- Consent/artist direction for intentionally public profile publication.
- Legitimate interests for ownership and access logs.

Retention:

- Active workspace lifetime.
- Deleted when a sole-owner workspace is removed during account erasure.
- Shared workspaces remain if another owner exists; the deleting user's
  membership is removed.

Notes:

- Public/private depends on publish state and specific field.
- Contact email, full bio, images, and labels can identify people and third
  parties.
- Artist profile is tenant-root data for most authorization decisions.

### Public Page and Block Data

Representative fields:

- `pages.title`
- `pages.is_published`
- `blocks.type`
- `blocks.title`
- `blocks.config`
- `blocks.localized_content`
- `blocks.position`
- block-specific link, embed, text, image, contact, rider, merch, and capture
  settings

Source:

- Dashboard page builder.
- Localized block content editor.

Purpose:

- Render public artist pages.
- Provide links, embeds, forms, stores, smart merch, and fan capture blocks.

Legal basis:

- Contract for platform functionality.
- Artist consent/direction for public publication.
- Legitimate interests for abuse controls and content integrity.

Retention:

- Active workspace/page lifetime.
- Deleted through artist workspace deletion cascade.
- Public caching/indexing by browsers/search/social platforms may outlive
  StageLink deletion and must be disclosed.

Notes:

- Blocks may contain personal data, business contact information, URLs to third
  parties, and user-generated content.
- Contact form blocks can collect visitor data depending on configuration and
  email-delivery implementation.

### EPK Data

Representative fields:

- headline, short/full bio, press quote
- booking email
- management and press contact
- hero/artist/gallery image URLs
- featured media and featured links
- highlights
- rider info, technical requirements
- location and availability notes
- translations
- publish flag

Source:

- EPK editor.
- Reused profile data and uploaded assets.

Purpose:

- Create a public or private electronic press kit.
- Provide booking, press, technical, and performance information.

Legal basis:

- Contract for EPK creation and publication.
- Artist direction/consent for public publication.

Retention:

- Active workspace lifetime.
- Deleted with sole-owner artist workspace deletion.

Notes:

- Higher privacy risk than standard profile data because EPKs may include
  travel, availability, rider, staff, or contact details.
- EPK public URLs may be shared externally and cached.

### Fan and Subscriber Data

Representative fields:

- `subscribers.email`
- artist/page/block attribution
- consent boolean
- consent text snapshot
- hashed IP
- source page path
- locale
- status and timestamps

Source:

- Public email capture block submissions.

Purpose:

- Let fans subscribe to an artist's updates.
- Preserve consent evidence and source attribution.
- Provide artist-owned fan list functionality.

Legal basis:

- Consent for fan subscription.
- Legitimate interests for deduplication, security, and consent evidence.
- Hybrid role: artist may be controller for fan list; StageLink acts as
  processor/platform operator for storage and delivery.

Retention:

- Active until unsubscribed, deleted by artist/account erasure, or future
  retention automation.
- Current deletion removes subscribers for deleted sole-owner workspaces.

Notes:

- Direct personal data with elevated sensitivity due to fan/artist association.
- Subscriber DSAR/unsubscribe workflows need final operational definition.

### Analytics and Tracking Data

Representative fields:

- event type: page view, link click, smart-link resolution, fan capture submit
- artist, block, link, and smart link identifiers
- hashed IP
- country/device
- label
- bot/internal/QA flags
- tracking consent flag
- environment
- timestamp
- PostHog identifiers/events when analytics consent is granted

Source:

- Public page/link interactions.
- SmartLink redirects.
- Email capture success events.
- Product analytics instrumentation gated by consent.

Purpose:

- Provide artists with engagement metrics.
- Support product analytics only after valid consent.
- Filter bot/internal/QA traffic.

Legal basis:

- Consent for non-essential analytics and PostHog.
- Legitimate interests may apply only to strictly necessary security/abuse
  metrics and aggregated operational diagnostics.

Retention:

- Current raw analytics retention is not automatically enforced.
- Recommended launch default: raw events 13 months, aggregated metrics 24
  months, QA/internal events 90 days.

Notes:

- Hashed IP remains personal data risk if linkable with other data.
- Consent gating has been implemented for optional tracking, but retention
  automation remains a gap.

### Payments and Billing Metadata

Representative fields:

- plan tier and subscription status
- Stripe customer, subscription, and price IDs
- cancel/current-period timestamps
- Stripe event ID/type/time
- checkout/portal metadata including artist ID, username, initiating user ID,
  environment

Source:

- Stripe Checkout/Portal.
- Stripe webhook events.
- Billing service.

Purpose:

- Manage subscription access and feature entitlements.
- Process payments and subscription lifecycle.
- Ensure webhook idempotency.

Legal basis:

- Contract for paid services.
- Legal obligation for tax/accounting/payment records.
- Legitimate interests for fraud prevention and webhook integrity.

Retention:

- Local subscription metadata for active account/workspace lifetime.
- Stripe retains payment records according to Stripe/legal obligations.
- Stripe webhook idempotency records should be retained long enough to prevent
  replay/duplicate processing; recommended minimum 13 months.

Notes:

- StageLink does not store full card numbers in the app database.
- Stripe is a critical processor/independent payment provider.

### Platform Insights and Integrations

Representative fields:

- platform: Spotify, YouTube, SoundCloud
- connection method and status
- external account ID/handle/URL/display name
- OAuth access/refresh tokens and expiry where applicable
- scopes
- provider metadata
- sync status/error timestamps
- snapshots: profile JSON, metrics JSON, top content JSON, notes

Source:

- User-provided references.
- Provider API validation/sync.
- OAuth flows where enabled.

Purpose:

- Connect artist platform accounts.
- Display multi-platform performance insights.
- Support Pro+ feature entitlements.

Legal basis:

- Contract for connected-platform insights.
- User authorization/consent for OAuth/provider access.

Retention:

- Active connection lifetime.
- Deleted with artist workspace deletion.
- Disconnect should remove tokens and stop sync; provider-side revocation needs
  operational confirmation.

Notes:

- OAuth tokens and refresh tokens are secrets and must never appear in exports,
  logs, or UI.
- Provider terms and scopes must be reviewed before public scale.

### Store and Merch Integrations

Representative fields:

- Shopify store domain, storefront token, store name
- collection handle and product handles
- Printful/Printify provider, API token, store ID/name
- connection status

Source:

- Dashboard settings.
- Shopify/merch provider APIs.

Purpose:

- Display storefront or merch blocks on public artist pages.
- Let artists configure commerce integrations.

Legal basis:

- Contract for merch/store features.
- User authorization for provider API access.

Retention:

- Active connection lifetime.
- Deleted with artist workspace deletion.
- Disconnect should remove provider tokens and stop external API use.

Notes:

- API tokens are sensitive secrets.
- Public product display may reveal business/store information.

### Uploads and Asset Metadata

Representative fields:

- asset ID, artist ID, creator user ID
- asset kind
- storage provider/bucket/object key
- original filename
- MIME type and size
- delivery URL
- status and timestamps

Source:

- Upload intent API.
- Direct client upload to presigned object-storage URL.
- Upload confirmation API.

Purpose:

- Store profile, cover, gallery, and EPK images.
- Serve public media where selected by the artist.

Legal basis:

- Contract for media hosting.
- Artist direction/consent for public publication.

Retention:

- Active asset/workspace lifetime.
- Deleted with sole-owner artist workspace deletion in local DB; object-storage
  deletion behavior must be verified and automated where needed.

Notes:

- Images may contain personal data, likenesses, venue data, or third-party IP.
- Original filenames can contain personal data and should be minimized if not
  needed.

### DSAR, Consent, and Privacy Records

Representative fields:

- `dsar_requests`: user ID, request type/status, metadata, completion timestamp
- `audit_logs`: action/entity/metadata/IP for privacy actions
- browser `sl_consent` cookie with categories, timestamp, and version
- `sl_ac` analytics consent compatibility cookie

Source:

- Privacy settings UI.
- DSAR endpoints.
- Consent manager.

Purpose:

- Support access, rectification, erasure, portability, and consent withdrawal.
- Prove request lifecycle and consent state.
- Enforce analytics tracking decisions.

Legal basis:

- Legal obligation and legitimate interests for privacy compliance.
- Consent for optional analytics/marketing categories.

Retention:

- DSAR/audit records should be retained for a limited legal-defense period.
  Recommended default: 3 years unless counsel advises otherwise.
- Consent cookie expires after 180 days.

Notes:

- Current consent history is browser-local; StageLink does not maintain a
  server-side consent event ledger for account users.

### Logs and Technical Metadata

Representative data:

- request IPs or forwarded IPs in platform logs
- user-agent strings
- route, status, timestamps
- deployment/build logs
- error messages
- rate-limit keys/counters
- audit log IP address where passed

Source:

- Vercel web runtime.
- Railway API/runtime.
- GitHub Actions.
- Application logger.
- Rate-limit guards/utilities.

Purpose:

- Security monitoring.
- Abuse prevention.
- Troubleshooting.
- CI/CD operations.

Legal basis:

- Legitimate interests for security and operations.

Retention:

- Recommended: shortest provider-supported period for raw runtime logs,
  typically 30 to 90 days for launch.
- Security/audit logs may need longer retention; recommended 12 to 36 months
  depending on risk/legal review.

Notes:

- Logs must not include tokens, raw request bodies, full emails unless
  necessary, or provider secrets.
- Some provider log retention is controlled outside the app.

### Landing and Support Contact Data

Representative fields:

- name
- email
- artist type
- message
- IP-derived rate-limit key
- Resend delivery metadata

Source:

- Marketing/landing contact form.

Purpose:

- Respond to inbound visitor/business inquiries.
- Prevent spam and abuse.

Legal basis:

- Legitimate interests for responding to inbound requests.
- Consent/contract steps may apply if the visitor requests commercial contact.

Retention:

- Email inbox/provider retention until no longer needed.
- Recommended default: 12 months for unresolved leads, shorter for spam.

Notes:

- Message content is free text and may contain sensitive data submitted by the
  visitor. Do not log message bodies.
