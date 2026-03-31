# Fan Email Capture Block — Technical Documentation

> T4-3 implementation. Last updated: 2026-03-30.

---

## Overview

The `email_capture` block allows an artist to collect fan emails directly on their public page. Fans submit their email (with optional explicit consent) and the record is persisted in the `subscribers` table associated to the artist.

---

## Block Config Schema (`email_capture`)

```typescript
interface EmailCaptureBlockConfig {
  headline: string; // Required. Max 100 chars. Main heading shown on the form.
  buttonLabel: string; // Required. Max 50 chars. Submit button text.
  description?: string; // Optional. Max 300 chars. Subtext below headline.
  placeholder?: string; // Optional. Max 100 chars. Email input placeholder.
  successMessage?: string; // Optional. Max 200 chars. Message shown after successful submit.
  consentLabel?: string; // Optional. Max 200 chars. Consent checkbox label text.
  requireConsent?: boolean; // Optional. If true, consent checkbox must be checked to submit.
}
```

**Defaults (dashboard)**:

- `buttonLabel`: `"Subscribe"`
- `successMessage`: falls back to i18n key `blocks.renderer.email_capture.success_message`
- `consentLabel`: falls back to i18n key `blocks.renderer.email_capture.consent_default`

**Validation**: enforced server-side in `block-config.schema.ts`. The block is rejected at create/update time if required fields are missing or any field exceeds its max length.

---

## Subscriber Model

```typescript
// Table: subscribers
{
  id: string; // CUID — primary key
  artistId: string; // FK → artists.id — for per-artist queries
  blockId: string; // FK → blocks.id — source attribution
  pageId: string // FK → pages.id — nullable
    ? email
    : string; // Normalized (lowercase + trimmed)
  status: 'active' | 'unsubscribed'; // default: active
  consent: boolean; // Was consent explicitly given? (default: false)
  consentText: string // Snapshot of consent label shown at submit time
    ? ipHash
    : string // SHA-256(ip) — privacy-safe, nullable
      ? sourcePagePath
      : string // URL path at submit time (future use)
        ? locale
        : string // Visitor locale (future use)
          ? createdAt
          : DateTime;
  updatedAt: DateTime;
}
```

### What is stored

| Field                 | Stored            | Reason                            |
| --------------------- | ----------------- | --------------------------------- |
| email                 | ✅                | Core product value                |
| artistId              | ✅                | Required for per-artist isolation |
| blockId               | ✅                | Source attribution                |
| pageId                | ✅                | Source attribution                |
| status                | ✅                | Lifecycle management              |
| consent + consentText | ✅                | Consent audit trail               |
| ipHash (SHA-256)      | ✅                | Privacy-safe deduplication signal |
| sourcePagePath        | ✅ (null for now) | Future analytics                  |
| locale                | ✅ (null for now) | Future localization               |

### What is NOT stored

| Field                | Reason                                        |
| -------------------- | --------------------------------------------- |
| Raw IP address       | Privacy — only SHA-256 hash stored            |
| User agent string    | Not necessary for basic product               |
| Full page URL        | sourcePagePath is nullable, not yet populated |
| Any PII beyond email | GDPR minimization principle                   |

---

## Duplicate Policy

**Unique constraint**: `@@unique([artistId, email])`

- The **same fan cannot subscribe twice to the same artist**, regardless of which block they used.
- The **same fan CAN subscribe to different artists** — this is expected and valid.
- If the same email is submitted again for the same artist, the backend returns `200 { ok: true }` without creating a new record (idempotent success). The fan sees the success state either way.
- **Why per-artist, not per-block**: An artist may have multiple `email_capture` blocks on their page (e.g., top + bottom). Treating these as separate subscription points would create duplicates in the artist's list. One subscriber per artist is cleaner and avoids confusion at export time.

---

## Consent Policy

### What "consent" means in this implementation

1. If `requireConsent = true` on the block config, the frontend renders a required checkbox.
2. The user **must check the checkbox** before submitting — client-side validation prevents submission, and the backend also validates (`consent must be true`).
3. When consent is given, the backend stores:
   - `consent = true`
   - `consentText` = snapshot of `config.consentLabel` at the time of submission (or `null` if no label was set)
4. If `requireConsent = false` (default), no checkbox is shown and `consent = false` is stored.

### What consent does NOT cover yet

- Explicit opt-in email confirmation (double opt-in)
- Unsubscribe center / preference management
- Legal text versioning (tracking which version of terms was shown)
- GDPR data subject requests (access, deletion)
- Retention policies

These are documented as future tasks (T6-x or dedicated legal/compliance tasks).

---

## Anti-Abuse Protection

### Implemented

| Protection               | Mechanism                                                   | What it protects against                  |
| ------------------------ | ----------------------------------------------------------- | ----------------------------------------- |
| Rate limiting            | `PublicRateLimitGuard` (120 req/60s per IP)                 | Mass submissions from a single IP         |
| Honeypot field           | `website` field in DTO — silently drops if non-empty        | Bots that auto-fill all form fields       |
| Idempotence              | Unique constraint `[artistId, email]`                       | Repeat submissions of same email          |
| Backend email validation | `@IsEmail()` + `@MaxLength(254)` in DTO                     | Invalid/oversized email strings           |
| Block validation         | Block must exist, be published, and be `email_capture` type | Submissions to arbitrary/invalid blockIds |
| Consent enforcement      | Backend validates `consent=true` when `requireConsent=true` | Frontend bypass attempts                  |

### NOT implemented yet (future)

| Protection                                        | When                        |
| ------------------------------------------------- | --------------------------- |
| Redis-backed rate limiting (multi-instance)       | T4-4 or infrastructure task |
| CAPTCHA                                           | If abuse signals warrant it |
| Email domain blocklist                            | If abuse signals warrant it |
| Velocity checks (submissions per artist per hour) | T4-4                        |

### Notes on honeypot

The `website` field is a classic honeypot. It is:

- Rendered in the HTML (so bots see it) but visually hidden via CSS (`absolute -left-[9999px]`)
- Has `tabIndex={-1}` and `readOnly` — real users cannot interact with it
- The frontend always sends it as an empty string
- The backend silently returns `200 { ok: true }` without writing to DB when `website` is non-empty — this avoids revealing the protection to bot operators

---

## API Endpoints

### Public (no auth)

#### `POST /api/public/blocks/:blockId/subscribers`

Submit a fan email for a published `email_capture` block.

**Rate limit**: 120 req/60s per IP (same guard as link-click endpoint)

**Request body**:

```json
{
  "email": "fan@example.com",
  "consent": true,
  "website": ""
}
```

- `email`: required, valid email, max 254 chars
- `consent`: optional boolean. Required to be `true` if block has `requireConsent=true`
- `website`: honeypot field — should always be empty (omit or send `""`)

**Responses**:

- `200 { ok: true }` — success (new or duplicate)
- `400` — invalid email, missing required consent
- `404` — block not found or not published
- `422` — block type is not `email_capture`
- `429` — rate limited

---

### Private (requires auth + ownership)

#### `GET /api/artists/:artistId/subscribers`

Returns paginated subscriber list for the authenticated artist.

**Query params**: `page` (default: 1), `limit` (default: 50, max: 100)

**Response**:

```json
{
  "items": [
    {
      "id": "...",
      "email": "fan@example.com",
      "status": "active",
      "consent": true,
      "sourceBlockId": "...",
      "createdAt": "2026-03-30T..."
    }
  ],
  "total": 42,
  "page": 1,
  "limit": 50
}
```

---

#### `GET /api/artists/:artistId/subscribers/export`

Downloads a CSV file of all subscribers for the authenticated artist.

**Response**: `text/csv` file download

**Filename**: `subscribers-{artistId}.csv`

**Columns**:

```
email,status,consent_given,created_at,source_block_id
```

**Example**:

```
email,status,consent_given,created_at,source_block_id
fan@example.com,active,true,2026-03-30T12:00:00.000Z,clxyz...
```

---

## Analytics Integration

Fan capture submits a `fan_capture_submit` event to **both** PostHog and the local `analytics_events` table.

### Event properties

```typescript
{
  artist_id: string;
  username: string;
  environment: string;
  page_id: string;
  block_id: string;
  success: true;
}
```

**Not included (PII protection)**:

- No `email`
- No `ip_address` (ip_hash used in DB, not in PostHog)
- No personal data

### Fire-and-forget

Both analytics writes are fire-and-forget — they never block or affect the fan's `200` response. A failure in analytics never causes a failed subscribe.

---

## Privacy Considerations

| Data              | How it's protected                                                        |
| ----------------- | ------------------------------------------------------------------------- |
| Fan email         | Not sent to analytics (PostHog or local DB events)                        |
| IP address        | Stored only as SHA-256 hash — cannot be reversed                          |
| Cross-artist data | All queries are scoped to `artistId` — impossible to leak between tenants |
| Consent text      | Stored as a snapshot at submit time — audit trail                         |
| Export scope      | CSV only includes email, status, consent_given — minimal useful set       |

---

## Dashboard UI

### Config form (`BlockConfigForm`)

Fields available for `email_capture`:

- **Headline** (required)
- **Button label** (required)
- **Description** (optional)
- **Email placeholder** (optional)
- **Success message** (optional)
- **Consent section**:
  - Toggle: "Require explicit consent checkbox"
  - Consent label text (shown when require consent is enabled)

### Public renderer (`EmailCaptureRenderer`)

- Shows headline, description (if set), email input
- Shows consent checkbox if `requireConsent=true` OR `consentLabel` is set
- Honeypot field is rendered but hidden
- Success state shows custom `successMessage` or fallback i18n string
- Error state shows retry-friendly message
- Preview mode (no blockId): form visible but non-functional, shows hint text

---

## Recommended Next Steps

### T4-4 — Anti-abuse hardening

- Redis-backed rate limiter (replaces in-memory, works across instances)
- IP-level velocity checks per artist (e.g., max 20 submissions/hour/IP/artist)
- Email domain reputation check (optional)

### T5-x — Subscriber management

- Dashboard subscriber list with pagination
- Unsubscribe endpoint (`PATCH /api/public/blocks/:blockId/subscribers/:id`)
- Subscriber count widget in analytics dashboard

### T6-x — Integrations

- Mailchimp / ConvertKit / Klaviyo webhook on new subscriber
- Double opt-in email flow (send confirmation email, require click)
- Export with locale + source_page_path columns

### Legal/compliance

- GDPR data subject request endpoints (access, deletion)
- Consent text versioning
- Retention policy enforcement (auto-delete old records)
