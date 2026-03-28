# Artist Profile Editor — Technical Documentation

**Task**: T3-3
**Status**: Implemented
**Route**: `/{locale}/dashboard/profile`

---

## Overview

The artist profile editor allows authenticated users with write access to their artist to edit core profile data: name, bio, category, social links, images, and SEO metadata.

---

## Architecture

### Data flow

```
(app)/layout.tsx          — auth guard + shell artist load (deduped by Next.js)
  └─ dashboard/profile/page.tsx  — SSR: resolves artist via getAuthMe + getArtist
       └─ ArtistProfileSettings  — client: react-hook-form + sections
            ├─ ProfileImagesSection   — immediate upload (asset pipeline)
            ├─ ProfileBasicInfo       — displayName, bio, category
            ├─ ProfileSocialLinks     — social URLs + contact email
            └─ ProfileSeoSection      — seoTitle, seoDescription, readonly username
```

### Save strategy

- **Images** (avatar, cover): saved **immediately** via the presigned URL pipeline (intent → S3 → confirm). Independent of the form.
- **Text fields** (basic info, social links, SEO): saved **together** on form submit via `PATCH /api/artists/:id`.

This separation avoids a "pending upload" problem where the user might click Save before an image finishes uploading.

---

## Fields supported

| Section | Field            | DB column                        | Notes                  |
| ------- | ---------------- | -------------------------------- | ---------------------- |
| Basic   | `displayName`    | `display_name`                   | Required, max 100      |
| Basic   | `bio`            | `bio`                            | Optional, max 500      |
| Basic   | `category`       | `category`                       | Enum (ArtistCategory)  |
| Images  | `avatarUrl`      | `avatar_url` + `avatar_asset_id` | Via asset pipeline     |
| Images  | `coverUrl`       | `cover_url` + `cover_asset_id`   | Via asset pipeline     |
| Social  | `instagramUrl`   | `instagram_url`                  | Optional URL           |
| Social  | `tiktokUrl`      | `tiktok_url`                     | Optional URL           |
| Social  | `youtubeUrl`     | `youtube_url`                    | Optional URL           |
| Social  | `spotifyUrl`     | `spotify_url`                    | Optional URL           |
| Social  | `soundcloudUrl`  | `soundcloud_url`                 | Optional URL           |
| Social  | `websiteUrl`     | `website_url`                    | Optional URL           |
| Contact | `contactEmail`   | `contact_email`                  | Optional email, public |
| SEO     | `seoTitle`       | `seo_title`                      | Optional, max 60       |
| SEO     | `seoDescription` | `seo_description`                | Optional, max 160      |

---

## Username (read-only)

**Decision**: Username is NOT editable from the profile editor.

**Rationale**:

1. Username is the multi-tenant resolution key (`/[username]` public pages).
2. Changing it silently breaks all existing shared URLs.
3. Requires: uniqueness validation + race condition protection + redirect/canonical strategy.

**Future work**: Username change will be a dedicated flow (under `/dashboard/settings/account`) with:

- Identity re-verification
- Explicit warning about URL changes
- Grace period redirect from old username (optional)

The username is shown as read-only in the SEO section for context.

---

## Social links — design decision

Social links are stored as **explicit columns on the `artists` table** (not JSONB, not a separate table).

**Rationale**: The set of platforms is fixed and small (6 platforms + contact email). Direct columns give:

- Strong typing (no JSON parsing)
- Simple queries and indexing if needed
- Safe nullability (each field independently nullable)

**Future**: If we need user-defined custom links (arbitrary label + URL), we will add a separate `artist_links` table. The social columns stay as "verified profiles" while custom links are managed separately.

---

## Validations

### Frontend (Zod — `profile.schema.ts`)

| Field            | Rule                                      |
| ---------------- | ----------------------------------------- |
| `displayName`    | required, min 1, max 100                  |
| `bio`            | optional, max 500                         |
| `category`       | must be a valid ArtistCategory enum value |
| URL fields       | empty string or valid `http(s)://` URL    |
| `contactEmail`   | empty string or valid email               |
| `seoTitle`       | optional, max 60                          |
| `seoDescription` | optional, max 160                         |

### Backend (class-validator — `UpdateArtistDto`)

Mirrors frontend schema. Key additions:

- `@Transform` converts empty string → `null` for optional URL/email fields (allows clearing).
- `@IsEnum(ArtistCategory)` validates category against Prisma enum.
- `@IsUrl({ require_protocol: true })` requires absolute URLs.
- `@IsEmail()` for contact email.

Empty string → null transform runs before validators, so `@IsOptional()` skips `@IsUrl` for null values.

---

## Permissions

| Check              | Where                                                         | Detail                                                           |
| ------------------ | ------------------------------------------------------------- | ---------------------------------------------------------------- |
| Auth required      | `(app)/layout.tsx`                                            | Redirects to login if no session                                 |
| Artist membership  | `@CheckOwnership('artist', 'id', 'write')` + `OwnershipGuard` | Returns 403 if user lacks write access                           |
| Asset ownership    | `AssetsService.confirmUpload`                                 | Validates asset belongs to the artist                            |
| Cross-tenant asset | `AssetsService.createUploadIntent`                            | `membershipService.validateAccess` before creating presigned URL |

---

## Audit trail

The following events are logged via `AuditService` (fire-and-forget):

| Event                    | Trigger                                                  |
| ------------------------ | -------------------------------------------------------- |
| `artist.profile.updated` | `PATCH /api/artists/:id` — logs which field keys changed |
| `asset.upload.intent`    | Presigned URL created                                    |
| `asset.upload.confirm`   | Upload confirmed, artist updated                         |

---

## Multi-artist support

**Current**: The profile page resolves `artistIds[0]` from `/api/auth/me` — the first (and typically only) artist.

**Future**: When a user can manage multiple artists:

1. The page receives a selected `artistId` (from a query param or a selector component).
2. `ArtistProfileSettings` receives the artist as a prop — no internal changes needed.
3. The page validates that the selected artistId belongs to the current user (already enforced server-side via ownership guard).

---

## SEO fallbacks (future)

When `seoTitle` / `seoDescription` are null, the public page should fall back to:

- `seoTitle` → `displayName + " — Official Page"` (or similar)
- `seoDescription` → first 160 characters of `bio`

This fallback logic lives in the public page renderer (not yet implemented in T3-3).

---

## Next steps

1. **T3-4**: Public artist page — uses `PublicArtist` type with social links and SEO fields now available.
2. **Username change**: Dedicated settings flow with identity re-verification.
3. **OG image**: Allow custom OG image upload (separate asset kind).
4. **Profile completeness**: Show a progress indicator (% complete based on filled fields).
5. **Social link order**: Allow drag-and-drop reordering (requires `artist_links` table).

---

## QA checklist

### Auth & permissions

- [ ] Unauthenticated user → redirects to login
- [ ] User with no artist → redirects to /onboarding
- [ ] User with read-only membership → 403 from PATCH endpoint
- [ ] User with write membership → can save

### Form behavior

- [ ] Form pre-fills with current artist data
- [ ] Save button disabled when no changes
- [ ] Save button disabled during submission
- [ ] Success message appears after save, clears after 4s
- [ ] Error message appears on network failure
- [ ] Form fields show per-field validation errors
- [ ] Empty URL fields are sent as null (not empty string)

### Images

- [ ] Avatar upload works (jpg/png/webp, max 5 MB)
- [ ] Cover upload works (jpg/png/webp, max 8 MB)
- [ ] Avatar / cover update without pressing Save
- [ ] Invalid file type shows error
- [ ] File too large shows error

### Validation

- [ ] Empty displayName → "Artist name is required"
- [ ] Bio > 500 chars → validation error
- [ ] Invalid URL (no protocol) → "Must be a valid URL"
- [ ] Invalid email → "Must be a valid email address"
- [ ] seoTitle > 60 chars → validation error
- [ ] seoDescription > 160 chars → validation error

### Data persistence

- [ ] Refreshing page shows updated data
- [ ] Social links saved correctly
- [ ] Null fields (cleared) are actually null in DB
- [ ] Category change persists

### UX

- [ ] "You have unsaved changes" shown when form is dirty
- [ ] Character counters shown for bio, seoTitle, seoDescription
- [ ] Username shown as read-only with explanation
