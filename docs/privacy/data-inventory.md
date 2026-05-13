# StageLink Initial Data Inventory

Status: initial inventory from the current repo and Prisma schema. This is a
living document and must be updated when new features are added.

## Data Stores

| Store | Current use | Data types |
| --- | --- | --- |
| PostgreSQL / Railway | Primary application database | Users, artists, EPKs, pages, blocks, analytics events, subscribers, subscriptions, integrations, assets, audit logs |
| WorkOS AuthKit | Authentication and sessions | Identity, email, auth methods, session/auth metadata |
| Stripe | Billing and subscriptions | Customer/payment/subscription data, invoice/payment event data |
| S3/R2-compatible storage | Artist uploads | Image assets, object keys, delivery URLs, file metadata |
| PostHog | Product/behavior analytics | Client/server analytics events, pseudonymous identifiers |
| Vercel | Web deployment/runtime | Request logs, environment variables, deployment logs |
| Railway | API/database deployment/runtime | API logs, environment variables, deployment logs, database |
| Upstash Redis | Rate limiting/operational cache where enabled | Request counters, abuse-control metadata |
| Email provider (Resend/EmailJS) | Transactional/contact email | Sender/recipient email, message content, delivery metadata |

## Data Categories

### Users

Model: `User`

Fields:

- WorkOS ID
- Email
- First name and last name
- Avatar URL
- Suspension/deletion timestamps
- Created/updated timestamps

Purpose:

- Account identity
- Login/session linkage
- Ownership and access control
- Support and security administration

Privacy notes:

- Email is direct personal data.
- WorkOS ID is pseudonymous but linkable to a person.
- `deletedAt` supports soft deletion, but a complete deletion/retention policy is
  still needed.

### Artists and Public Profiles

Models: `Artist`, `Page`, `Block`, `Epk`, `SmartLink`

Fields include:

- Username, display name, biography, full biography
- Artist category, tags, translations
- Avatar/cover/gallery image URLs
- Instagram, TikTok, YouTube, Spotify, SoundCloud, website links
- Contact email
- EPK booking, management, press, rider, tech, availability, location fields
- Page/block configuration and localized content
- SmartLink labels and destinations

Purpose:

- Publish artist pages and EPKs.
- Let artists present contact, booking, music, video, merch, and media links.
- Power public discovery and business workflows.

Privacy notes:

- Much of this data is intentionally public when pages/EPKs are published.
- Contact email, rider notes, availability, and management contacts may be more
  sensitive than standard profile copy.
- Users need clear controls to unpublish, edit, export, and delete this content.

### Fan/Subscriber Data

Model: `Subscriber`

Fields:

- Email
- Artist, page, block attribution
- Consent boolean and consent text snapshot
- IP hash
- Source page path
- Locale
- Status and timestamps

Purpose:

- Let fans subscribe to an artist's list.
- Preserve consent evidence.
- Attribute submissions to a block/page.

Privacy notes:

- Subscriber email is direct personal data.
- Artist may be the controller for the fan list; StageLink may be processor for
  storage and platform operations.
- Unsubscribe, export, delete, and artist access controls need formal handling.

### Analytics Data

Model: `AnalyticsEvent`

Fields:

- Artist and optional block
- Event type: page view, link click, smart link resolution, fan capture submit
- SHA-256 IP hash
- Country and device
- Link labels/IDs
- SmartLink ID
- Bot/internal/QA flags
- Tracking consent flag
- Environment
- Created timestamp

Purpose:

- Provide artists with page/link engagement metrics.
- Filter bot/QA/internal traffic.
- Support product diagnostics and data quality.

Privacy notes:

- IP is hashed before storage, which reduces but does not eliminate privacy risk.
- Current documentation describes an opt-out model where absent consent cookie
  allows analytics. That is a GDPR/ePrivacy gap for non-essential analytics.
- Raw events are currently not automatically deleted. Retention must be defined.

### Payments and Subscriptions

Models: `Subscription`, `StripeWebhookEvent`

Fields:

- Plan and subscription status
- Stripe customer/subscription/price IDs
- Current period/cancel timestamps
- Stripe webhook event IDs and event types

Purpose:

- Manage FREE/PRO/PRO+ access and billing state.
- Ensure webhook idempotency.

Privacy notes:

- Stripe is the payment processor for card/payment data.
- StageLink stores Stripe identifiers and billing state, not full card data.
- Accounting/tax retention period needs legal confirmation.

### Integrations and Insights

Models:

- `ArtistPlatformInsightsConnection`
- `ArtistPlatformInsightsSnapshot`
- `ShopifyConnection`
- `MerchProviderConnection`

Fields include:

- Platform type: Spotify, YouTube, SoundCloud
- Connection method: OAuth or reference
- External account IDs/handles/URLs
- Access and refresh tokens where applicable
- Scopes, metadata, sync status/errors
- Metrics snapshots and top content
- Shopify store domain, storefront token, product handles
- Merch provider API token, store ID/name

Purpose:

- Connect third-party artist accounts.
- Sync insights and merch/storefront data.
- Display selected external metrics in dashboards.

Privacy notes:

- OAuth tokens and API tokens are sensitive secrets.
- Scopes must be minimized and disclosed.
- Users need disconnect/delete flows.
- Provider terms and data transfer posture must be reviewed.

### Assets

Model: `Asset`

Fields:

- Artist ID and creator user ID
- Asset kind
- Storage provider, bucket, object key
- Original filename, MIME type, file size
- Delivery URL and status

Purpose:

- Store and serve artist media such as avatar, cover, EPK, and gallery images.

Privacy notes:

- Images may include personal data, likenesses, or third-party rights.
- File metadata can reveal personal information.
- Signed upload/download, MIME validation, size limits, and ownership checks are
  already security priorities and should remain privacy controls too.

### Security and Audit Logs

Model: `AuditLog`

Fields:

- Actor ID
- Action
- Entity type and ID
- Metadata
- IP address
- Created timestamp

Purpose:

- Security monitoring.
- Incident investigation.
- Admin/user action traceability.

Privacy notes:

- IP address can be personal data.
- Metadata must avoid secrets, tokens, and unnecessary personal data.
- Retention and access controls should be formalized.

## Retention Baseline

These retention periods are recommendations, not final legal policy:

| Data category | Recommended baseline |
| --- | --- |
| Account data | Active account life; delete/anonymize within 30-90 days after verified deletion request unless legal retention applies |
| Public profile/EPK/page data | Until user edits/deletes/unpublishes; remove from public delivery promptly after deletion |
| Subscriber/fan data | Until unsubscribe/deletion request, artist deletes list, or retention period expires |
| Analytics raw events | 13 months for raw events; longer only as aggregated/anonymized metrics |
| Security/audit logs | 12-24 months unless incident/legal hold applies |
| Billing records | Legal/accounting period to be confirmed by counsel |
| Uploaded assets | Until deleted by artist/account; define CDN/cache/backups purge behavior |
| Integration tokens | Until disconnected, account deletion, token expiry, or reauth failure cleanup |

## Missing Inventory Inputs

TODO:

- Confirm final email provider: Resend, EmailJS, or both.
- Confirm PostHog/Umami launch analytics stack and regions.
- Confirm S3/R2 provider and bucket region.
- Confirm Railway database region.
- Confirm Vercel project region/runtime settings where applicable.
- Confirm if Behind admin dashboard stores any additional admin-only data.
- Confirm if public contact forms store messages or only send emails.
- Confirm if StageLink will support minors, labels/agencies, or teams at launch.
