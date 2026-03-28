# Public Artist Page — SSR & SEO

Technical reference for the public artist page at `/{username}`.

## Architecture

```
GET /{locale}/{username}
  ↓
apps/web/src/app/[locale]/[username]/page.tsx  (Next.js Server Component)
  ↓ fetchPublicPage(username)              (React.cache() — one HTTP call per render)
  ↓
GET /api/public/pages/by-username/:username   (NestJS, @Public() — no auth required)
  ↓ TenantResolverService.resolveByUsername()
  ↓ PublicPagesService.loadPublicPage(artistId)
  ↓
Response: PublicPageResponse { artist: PublicArtist, blocks: PublicBlock[] }
```

## Tenant Resolution

Username resolution goes through `TenantResolverService`, which:

1. Looks up the artist by `username` (case-insensitive)
2. Verifies the artist has a published page
3. Returns the stable `artistId` (internal UUID, not the username)

All subsequent queries use `artistId` to prevent cross-tenant data leakage if a username changes.

## Data Shape

### `PublicArtist`

```ts
interface PublicArtist {
  username: string;
  displayName: string;
  bio: string | null;
  avatarUrl: string | null;
  coverUrl: string | null;
  seoTitle: string | null; // Custom page title for SEO
  seoDescription: string | null; // Custom meta description for SEO
}
```

Only allow-listed fields are exposed — `userId` and other internal fields are never included.

### `PublicBlock`

Only `isPublished: true` blocks are returned, ordered by `position`.

## SEO Metadata (`generateMetadata`)

Priority fallback chain:

| Tag                         | Priority                                               |
| --------------------------- | ------------------------------------------------------ |
| `<title>`                   | `seoTitle` → `{displayName} (@{username}) — StageLink` |
| `<meta name="description">` | `seoDescription` → `bio` → generic fallback            |
| `<link rel="canonical">`    | `{NEXT_PUBLIC_APP_URL}/{username}`                     |
| OG `title`                  | `seoTitle` → `displayName`                             |
| OG `description`            | same as meta description                               |
| OG `image`                  | `avatarUrl` (if present)                               |
| Twitter card                | `summary`                                              |

`robots: { index: true, follow: true }` on valid pages; `{ index: false, follow: false }` on 404.

## Image Domains

Artist images (avatar, cover) are served from S3 / CDN. Next.js `<Image>` requires the
hostname to be declared in `next.config.ts`:

```
NEXT_PUBLIC_IMAGES_HOSTNAME=your-bucket.s3.us-east-1.amazonaws.com
```

Set this to the hostname portion of the API's `AWS_S3_PUBLIC_BASE_URL`.

## Caching Strategy

`fetchPublicPage` uses `cache: 'no-store'` to prevent stale content between tenants.
It is wrapped with `React.cache()` so `generateMetadata` and the Server Component share
the same response within a single render tree — only one HTTP round-trip per page load.

> **ISR migration path**: Replace `cache: 'no-store'` with `next: { revalidate: 60 }` and
> add `export const revalidate = 60` at the page level once per-tenant ISR is needed.

## Error Handling

| Scenario                          | Handler                                   |
| --------------------------------- | ----------------------------------------- |
| Username not found (404 from API) | `notFound()` → `not-found.tsx` → HTTP 404 |
| Backend error (5xx)               | Error propagates → `error.tsx` → retry UI |
| Render error                      | `error.tsx` catches it                    |

## Reserved Usernames

Route-level conflict prevention: locale codes (`en`, `es`, etc.) and app paths (`api`,
`dashboard`, `onboarding`, etc.) are validated as reserved at the backend level in
`apps/api/src/common/constants/reserved-usernames.ts`. These paths will never match
the `[username]` segment for a valid artist.

## Internationalization

Static strings in `ArtistPageView` use the `public_page` i18n namespace:

| Key                            | Usage                                         |
| ------------------------------ | --------------------------------------------- |
| `public_page.no_blocks`        | Shown when the artist has no published blocks |
| `public_page.powered_by`       | Footer prefix text                            |
| `public_page.powered_by_brand` | "StageLink" in the footer                     |

The component uses `getTranslations('public_page')` (server-side) — no client boundary needed.

## Component Tree

```
[username]/page.tsx              Server Component
  └── ArtistPageView             async Server Component
        ├── next/image (cover)
        ├── next/image (avatar)
        └── BlockRenderer        per block
              ├── LinksBlockRenderer
              ├── MusicEmbedRenderer
              ├── VideoEmbedRenderer
              └── EmailCaptureRenderer  'use client' (form state)
```

## Key Files

| File                                                              | Purpose                                                   |
| ----------------------------------------------------------------- | --------------------------------------------------------- |
| `apps/web/src/app/[locale]/[username]/page.tsx`                   | Server Component + `generateMetadata`                     |
| `apps/web/src/app/[locale]/[username]/not-found.tsx`              | 404 boundary                                              |
| `apps/web/src/app/[locale]/[username]/error.tsx`                  | Error boundary (Client Component)                         |
| `apps/web/src/features/public-page/components/ArtistPageView.tsx` | Page layout + header                                      |
| `apps/web/src/lib/public-api.ts`                                  | `fetchPublicPage` with React.cache()                      |
| `apps/web/next.config.ts`                                         | `images.remotePatterns` via `NEXT_PUBLIC_IMAGES_HOSTNAME` |
| `apps/api/src/modules/public/public-pages.service.ts`             | Data loading + tenant isolation                           |
| `apps/api/src/modules/public/dto/public-page-response.dto.ts`     | Public-safe DTOs                                          |
| `packages/types/src/artist.ts`                                    | Shared `PublicArtist` / `PublicPageResponse` types        |
