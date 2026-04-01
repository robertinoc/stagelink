# Block Engine — Technical Documentation

## Overview

The block engine is the core system that allows artists to build their public page by composing ordered, configurable content blocks.

---

## Data Model

### Block

```prisma
model Block {
  id          String    @id @default(cuid())
  pageId      String    @map("page_id")
  type        BlockType
  title       String?
  config      Json      @default("{}")
  position    Int       @default(0)
  isPublished Boolean   @default(false) @map("is_published")
  createdAt   DateTime  @default(now()) @map("created_at")
  updatedAt   DateTime  @updatedAt @map("updated_at")
}
```

### BlockType enum

```prisma
enum BlockType {
  links
  music_embed
  video_embed
  email_capture
}
```

### Relationships

```
Artist (1) → Page (1) → Block (many)
```

Ownership resolves through `Block.pageId → Page.artistId`.
The `artistId` is **not** stored directly on `Block` — it is always resolved server-side via `MembershipService.resolveArtistIdForResource('block', blockId)`.

---

## Config Schema Per Block Type

The `config` field is a JSON column validated server-side before every write.
Validation is in `apps/api/src/modules/blocks/schemas/block-config.schema.ts`.

### `links`

```ts
{
  items: Array<{
    label: string; // max 100 chars
    url: string; // https:// or http:// only
    iconUrl?: string;
  }>;
  // 1–20 items
}
```

### `music_embed`

```ts
{
  provider: 'spotify' | 'apple_music' | 'soundcloud' | 'youtube';
  embedUrl: string; // https:// only
}
```

### `video_embed`

```ts
{
  provider: 'youtube' | 'vimeo' | 'tiktok';
  embedUrl: string; // https:// only
}
```

### `email_capture`

```ts
{
  headline: string;      // max 100 chars
  buttonLabel: string;   // max 50 chars
  description?: string;  // max 300 chars
  placeholder?: string;  // max 100 chars
}
```

---

## API Endpoints

### Page-scoped (require page membership)

| Method | Path                                | Description                         |
| ------ | ----------------------------------- | ----------------------------------- |
| GET    | `/api/pages/:pageId/blocks`         | List all blocks ordered by position |
| POST   | `/api/pages/:pageId/blocks`         | Create a new block                  |
| PATCH  | `/api/pages/:pageId/blocks/reorder` | Batch reorder blocks                |

### Block-level (require block membership, resolved via page)

| Method | Path                             | Description                |
| ------ | -------------------------------- | -------------------------- |
| PATCH  | `/api/blocks/:blockId`           | Update title and/or config |
| DELETE | `/api/blocks/:blockId`           | Hard-delete a block        |
| POST   | `/api/blocks/:blockId/publish`   | Mark as published          |
| POST   | `/api/blocks/:blockId/unpublish` | Mark as unpublished        |

### Auth

All endpoints require `Authorization: Bearer <JWT>` (JwtAuthGuard is global).
Ownership is enforced by `OwnershipGuard` + `@CheckOwnership` on every endpoint.

---

## Sort Order Strategy

- **Field**: `position: Int` (0-indexed integer)
- **Creation**: new block gets `max(position) + 1` — always appended at end
- **Reorder**: client sends `{ blocks: [{ id, position }] }` with the desired positions; server updates all in a transaction
- **Delete**: positions are left with gaps — harmless since rendering always uses `ORDER BY position ASC`
- **Duplicate positions**: rejected by the service (`BadRequestException`)
- **Cross-page injection**: prevented by `WHERE id = :blockId AND pageId = :pageId` in each reorder UPDATE

---

## Publish / Unpublish

- **Field**: `isPublished: Boolean` (default: `false`)
- New blocks always start as **draft** (`isPublished: false`)
- `POST /api/blocks/:blockId/publish` → sets `isPublished = true`
- `POST /api/blocks/:blockId/unpublish` → sets `isPublished = false`
- Dashboard shows both published and draft blocks
- **Public page render** (future): must filter `WHERE isPublished = true`

---

## Ownership & Authorization

| Check                           | Location                | How                                                                     |
| ------------------------------- | ----------------------- | ----------------------------------------------------------------------- |
| Valid JWT                       | `JwtAuthGuard` (global) | Verifies WorkOS JWT, injects `request.user`                             |
| User is artist member           | `OwnershipGuard`        | Calls `MembershipService.resolveArtistIdForResource` + `validateAccess` |
| Block belongs to page (reorder) | `BlocksService.reorder` | `WHERE id = :blockId AND pageId = :pageId` in each UPDATE               |
| Config is valid for type        | `BlocksService`         | Calls `validateBlockConfig(type, config)` before every write            |
| Block limit                     | `BlocksService.create`  | Returns 422 if `count >= MAX_BLOCKS_PER_PAGE (50)`                      |

---

## Security Mitigations

| Risk                                       | Mitigation                                                                                       |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------ |
| XSS via `javascript:` URLs in links/embeds | `assertSafeUrl()` blocks `javascript:`, `data:`, `vbscript:`, `blob:`                            |
| Arbitrary embed providers                  | Allowlist: music `[spotify, apple_music, soundcloud, youtube]`, video `[youtube, vimeo, tiktok]` |
| Prototype pollution via JSON config        | `assertPlainObject()` rejects non-plain objects                                                  |
| Oversized payloads                         | Max lengths on every string field; `ArrayMaxSize(100)` on reorder                                |
| Cross-page block injection                 | `pageId` constraint in reorder transaction                                                       |
| Unlimited block creation                   | `MAX_BLOCKS_PER_PAGE = 50` enforced on create                                                    |
| IDOR (accessing another artist's blocks)   | Ownership always resolved server-side, never trusted from body                                   |
| Stale config after type change             | Config is re-validated on every update against current block type                                |

---

## Public Page Render (Future)

The public page at `/api/public/pages/by-username/:username` should query:

```ts
const blocks = await prisma.block.findMany({
  where: { pageId, isPublished: true },
  orderBy: { position: 'asc' },
  select: { id: true, type: true, title: true, config: true, position: true },
});
```

**What NOT to expose publicly**:

- `isPublished` (internal state)
- `createdAt` / `updatedAt` (internal metadata)
- Block IDs can be exposed (they're needed for analytics click tracking)

The response shape is already defined in `@stagelink/types` → `Block` interface.

---

## Multiple Pages Per Artist (Future)

Currently the DB schema is 1:1 (Artist ↔ Page via `Page.artistId UNIQUE`).

When multiple pages are needed:

1. Remove `@unique` from `Page.artistId`
2. Add a page selector to `dashboard/page/page.tsx`
3. Add `GET /api/artists/:artistId/pages` endpoint
4. Block endpoints don't change — they're already scoped to `pageId`

---

## Adding a New Block Type

1. Add the enum value to `schema.prisma` → `BlockType`
2. Create a migration: `ALTER TYPE block_type ADD VALUE 'new_type';`
3. Add the config validator in `block-config.schema.ts` → `validateBlockConfig` switch
4. Add the config shape to `packages/types/src/block.ts`
5. Add `defaultConfig` case in `BlockConfigForm.tsx`
6. Add the form fields in `BlockConfigForm.tsx`
7. Add i18n keys in `messages/en.json` and `messages/es.json` under `blocks.types` and `blocks.type_descriptions`
8. Add the icon in `BLOCK_TYPE_ICONS` in `BlockManager.tsx`

The exhaustive `switch` in `validateBlockConfig` will produce a TypeScript compile error if you forget step 3.

---

## Delete Policy

**Hard delete** is used. Rationale:

- Simpler implementation and queries
- No production data that can't be recreated
- Audit log records the deletion (before the DELETE) with block type and pageId

If soft delete is needed later, add `deletedAt: DateTime?` and filter `WHERE deletedAt IS NULL`.

---

## Key Files

| File                                                          | Purpose                                 |
| ------------------------------------------------------------- | --------------------------------------- |
| `apps/api/prisma/schema.prisma`                               | Block model and BlockType enum          |
| `apps/api/prisma/migrations/20260328000000_block_engine/`     | DB migration                            |
| `apps/api/src/modules/blocks/schemas/block-config.schema.ts`  | Per-type config validation + URL safety |
| `apps/api/src/modules/blocks/dto/index.ts`                    | Request DTOs (class-validator)          |
| `apps/api/src/modules/blocks/blocks.service.ts`               | Business logic                          |
| `apps/api/src/modules/blocks/blocks.controller.ts`            | HTTP layer (two controllers)            |
| `apps/api/src/modules/blocks/blocks.module.ts`                | NestJS module                           |
| `packages/types/src/block.ts`                                 | Shared TypeScript types                 |
| `apps/web/src/lib/api/blocks.ts`                              | Web API client                          |
| `apps/web/src/lib/api/pages.ts`                               | Page resolution for dashboard           |
| `apps/web/src/features/blocks/components/BlockManager.tsx`    | Main block list + CRUD UI               |
| `apps/web/src/features/blocks/components/BlockConfigForm.tsx` | Per-type config forms                   |
| `apps/web/src/app/[locale]/(app)/dashboard/page/page.tsx`     | Dashboard page entry point              |
