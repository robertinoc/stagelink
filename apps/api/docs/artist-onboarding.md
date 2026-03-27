# Artist Onboarding — T3-1

## Overview

Onboarding flow that guides a new authenticated user through creating their first artist tenant.

## User Flow

```
1. User logs in (WorkOS AuthKit)
2. /dashboard → no artists → redirect to /[locale]/onboarding
3. Step 1: Enter display name
4. Step 2: Choose + validate username (debounced live check)
5. Step 3: Select artist category → POST /api/onboarding/complete (creates artist + page + membership)
6. Step 4: Upload avatar (optional, uses existing S3 pipeline)
7. Redirect to /[locale]/dashboard
```

## Frontend Routes

| Route                  | Description                                    |
| ---------------------- | ---------------------------------------------- |
| `/[locale]/onboarding` | Onboarding wizard (server page, requires auth) |
| `/[locale]/dashboard`  | Redirects to onboarding if user has no artists |

### Redirect Rules (no loops)

- `/onboarding` → if user has artists → redirect to `/dashboard`
- `/dashboard` → if user has no artists → redirect to `/onboarding`
- All other `(app)` routes: no automatic redirect

## Backend Endpoints

| Method | Path                                       | Description                              |
| ------ | ------------------------------------------ | ---------------------------------------- |
| `GET`  | `/api/onboarding/username-check?value=xxx` | Live username validation (auth required) |
| `POST` | `/api/onboarding/complete`                 | Creates artist + page + membership       |

### POST /api/onboarding/complete

**Request body:**

```json
{
  "displayName": "The Midnight",
  "username": "the-midnight",
  "category": "band",
  "assetId": "optional-pre-uploaded-avatar-asset-id"
}
```

**Response:**

```json
{
  "artistId": "cuid...",
  "username": "the-midnight",
  "displayName": "The Midnight",
  "pageId": "cuid..."
}
```

**Error responses:**

- `400` — invalid username format or invalid asset reference
- `409` — username already taken (race condition)
- `401` — not authenticated

## Data Created

After onboarding, the following records exist:

| Table                | Record                                                   |
| -------------------- | -------------------------------------------------------- |
| `artists`            | 1 artist with username, displayName, category            |
| `pages`              | 1 page (isPublished=false, title="{displayName}'s Page") |
| `artist_memberships` | 1 owner membership linking user → artist                 |
| `assets` (optional)  | 1 avatar asset (if uploaded at step 4)                   |

## Username Rules

- Min 3 chars, max 30 chars
- Allowed: `a-z`, `0-9`, `-`, `_`
- Must start and end with letter or digit
- No consecutive separators (`--`, `__`)
- Normalized: lowercase, trimmed
- Reserved words: `api`, `admin`, `www`, `stagelink`, etc. (see `reserved-usernames.ts`)
- Race condition: `UNIQUE` DB constraint + P2002 → 409 response

## Avatar Upload

Step 4 reuses the existing S3 presigned URL pipeline with the artist created in step 3:

1. `POST /api/assets/upload-intent` — creates Asset(pending) + presigned PUT URL
2. Client `PUT` to S3 directly
3. `POST /api/assets/:id/confirm` — marks as uploaded, updates `artist.avatarUrl`

If upload fails → user continues to dashboard (avatar is optional). No partial state issues.

## Transactional Safety

`POST /api/onboarding/complete` uses a Prisma `$transaction`:

- `artist` + `page` + `artistMembership` created atomically
- If any step fails → full rollback, no orphaned records
- Username uniqueness enforced at DB level (UNIQUE constraint) → catches race conditions (P2002 → 409)

## Multiple Artists per User

The architecture is ready for multiple artists:

- `artist_memberships` is the source of truth (not `artist.userId`)
- `GET /api/auth/me` returns `artistIds[]` (array, not single ID)
- Onboarding currently creates the first artist
- Future: add "Create another artist" flow at `/[locale]/onboarding/new` using same wizard

## Artist Categories

```typescript
type ArtistCategory =
  | 'musician'
  | 'dj'
  | 'actor'
  | 'actress'
  | 'painter'
  | 'visual_artist'
  | 'performer'
  | 'creator'
  | 'band'
  | 'producer'
  | 'other';
```

Stored as PostgreSQL enum `artist_category`. Default: `other`.

## Next Steps

- [ ] Post-onboarding checklist / empty state in dashboard
- [ ] Edit artist category from settings
- [ ] Cover photo upload in settings (already implemented)
- [ ] Artist profile completeness indicator
