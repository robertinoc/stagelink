# Public Artist Page — SSR & SEO

Technical reference for the public artist page. Public sharing URLs are canonicalized to
`/{username}`, while Next.js renders them through the internal route
`/p/[username]`.

## Architecture

```
GET /{username}                     (public canonical)
  ↓
rewrite → /p/{username}
  ↓
apps/web/src/app/(public)/p/[username]/page.tsx  (Next.js Server Component)
  ↓ fetchPublicPage(username)              (React.cache() — one HTTP call per render)
  ↓
GET /api/public/pages/by-username/:username   (NestJS, @Public() — no auth required)
  ↓ TenantResolverService.resolveByUsername()
  ↓ PublicPagesService.loadPublicPage(artistId)
  ↓
Response: PublicPageResponse { artist: PublicArtist, blocks: PublicBlock[], promoSlot }
```

## Tenant Resolution

Username resolution goes through `TenantResolverService`, which:

1. Looks up the artist by `username` (case-insensitive)
2. Verifies the artist has a page record that can be resolved publicly
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

### `PublicPromoSlot`

```ts
interface PublicPromoSlot {
  kind: 'none' | 'free_branding';
}
```

The backend resolves the promo slot from entitlements:

- `free_branding`: show the StageLink footer/promo slot on Free
- `none`: hide the slot on plans that include branding removal

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

## Public Media Rendering

Artist images (avatar, cover) are rendered with guarded plain `<img>` elements instead of
`next/image`.

Why:

- public assets can come from storage/CDN hosts that vary by environment
- conservative rendering is better than a broken optimized image boundary
- the UI now falls back safely if `cover` or `avatar` fail to load

Current behavior:

- broken `cover` → collapse to a neutral background
- broken `avatar` → show initial fallback

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

| Key                                   | Usage                                             |
| ------------------------------------- | ------------------------------------------------- |
| `public_page.no_blocks`               | Shown when the artist has no published blocks     |
| `public_page.branding_slot.title`     | Free-plan promo slot headline                     |
| `public_page.branding_slot.cta`       | CTA to pricing                                    |
| `public_page.branding_slot.secondary` | Rich text with links to StageLink home and signup |

The component uses `getTranslations('public_page')` (server-side) — no client boundary needed.

## Component Tree

```
p/[username]/page.tsx            Server Component
  └── ArtistPageView             async Server Component
        ├── PublicCoverImage     Client Component (fallback on error)
        ├── PublicAvatarImage    Client Component (fallback on error)
        └── PublicPageClient     per block / click tracking
              ├── LinksBlockRenderer
              ├── MusicEmbedRenderer
              ├── VideoEmbedRenderer
              └── EmailCaptureRenderer  'use client' (form state)
```

## Key Files

| File                                                                 | Purpose                                              |
| -------------------------------------------------------------------- | ---------------------------------------------------- |
| `apps/web/src/app/(public)/p/[username]/page.tsx`                    | Server Component + `generateMetadata`                |
| `apps/web/src/app/(public)/p/[username]/not-found.tsx`               | 404 boundary                                         |
| `apps/web/src/app/(public)/p/[username]/error.tsx`                   | Error boundary (Client Component)                    |
| `apps/web/src/features/public-page/components/ArtistPageView.tsx`    | Page layout + header + promo slot                    |
| `apps/web/src/features/public-page/components/PublicCoverImage.tsx`  | Cover image fallback on load failure                 |
| `apps/web/src/features/public-page/components/PublicAvatarImage.tsx` | Avatar image fallback on load failure                |
| `apps/web/src/lib/public-api.ts`                                     | `fetchPublicPage` with React.cache()                 |
| `apps/api/src/modules/public/public-pages.service.ts`                | Data loading + tenant isolation + promo slot resolve |
| `apps/api/src/modules/public/dto/public-page-response.dto.ts`        | Public-safe DTOs                                     |
| `packages/types/src/artist.ts`                                       | Shared `PublicArtist` / `PublicPageResponse` types   |
