# Block: Links / CTA — Technical Documentation

## Overview

The **links** block lets an artist compose an ordered list of CTA buttons on their public page.
Each button has a stable `id`, a human-readable label, a validated URL, an optional icon, and a
sort order. The block integrates fully with the existing block engine (CRUD, publish/unpublish,
ownership, audit).

---

## Config Schema

```ts
// packages/types/src/block.ts

interface LinksBlockConfig {
  items: LinkItem[];
}

interface LinkItem {
  id: string; // stable cuid — never changes after creation
  label: string; // max 100 chars, non-empty
  url: string; // https:// or http:// only
  icon?: LinkIcon; // optional; see Icon Policy below
  sortOrder: number; // 0-indexed integer, unique within the block
  openInNewTab?: boolean; // default true
}
```

Example:

```json
{
  "items": [
    {
      "id": "clxabc123",
      "label": "Listen on Spotify",
      "url": "https://open.spotify.com/artist/...",
      "icon": "spotify",
      "sortOrder": 0,
      "openInNewTab": true
    },
    {
      "id": "clxdef456",
      "label": "Watch on YouTube",
      "url": "https://youtube.com/@artist",
      "icon": "youtube",
      "sortOrder": 1,
      "openInNewTab": true
    }
  ]
}
```

---

## URL Validation Policy

Validated server-side in `block-config.schema.ts → assertSafeUrl()`.

| Protocol      | Status  | Reason                        |
| ------------- | ------- | ----------------------------- |
| `https://`    | Allowed | Primary protocol              |
| `http://`     | Allowed | Legacy / non-TLS destinations |
| `javascript:` | Blocked | XSS vector                    |
| `data:`       | Blocked | XSS vector                    |
| `vbscript:`   | Blocked | XSS vector                    |
| `blob:`       | Blocked | XSS vector                    |
| `mailto:`     | Blocked | Not supported in this stage   |
| `tel:`        | Blocked | Not supported in this stage   |

To add `mailto:` or `tel:` support later: add the protocol to the allowed list in
`assertSafeUrl()` and update this table.

---

## Icon Policy

Icons are validated against a fixed enum (`LINK_ICONS` in `@stagelink/types`).

### Supported keys

| Key           | Render fallback |
| ------------- | --------------- |
| `spotify`     | Music icon      |
| `apple_music` | Music icon      |
| `soundcloud`  | Music icon      |
| `youtube`     | Video icon      |
| `instagram`   | ExternalLink    |
| `tiktok`      | Video icon      |
| `facebook`    | ExternalLink    |
| `x`           | ExternalLink    |
| `website`     | Globe icon      |
| `mail`        | Mail icon       |
| `ticket`      | Ticket icon     |
| `link`        | Link icon       |
| `generic`     | ExternalLink    |

If `icon` is `undefined` or omitted, the renderer falls back to the `link` icon.

### Adding a new icon

1. Add the key to `LINK_ICONS` in `packages/types/src/block.ts`
2. Add the render mapping in `LinksBlockRenderer.tsx → ICON_MAP`
3. Add the label in `BlockConfigForm.tsx → LINK_ICON_OPTIONS`
4. The backend validation is automatic (enum is derived from `LINK_ICONS`)

---

## Sort Order Strategy

- Each item carries an explicit `sortOrder: number` (0-indexed integer).
- `sortOrder` must be **unique within the block** — validated server-side.
- The frontend normalises `sortOrder` to `0..n-1` on every mutation (add, remove, move).
- The renderer sorts items by `sortOrder` ascending before display.
- On deletion of an intermediate item, the frontend renumbers the remaining items.
- Stable `id` fields ensure analytics keys are never affected by reordering.

---

## Item IDs and Analytics Readiness

Each `LinkItem.id` is a `crypto.randomUUID()` generated client-side at item creation time.
It never changes after that — not on reorder, not on label/URL edit.

**Future click tracking shape:**

```ts
interface LinkClickEvent {
  blockId: string; // Block.id from the block engine
  itemId: string; // LinkItem.id — stable across edits
  artistId: string; // resolved from block → page → artist
  url: string; // destination URL at time of click
  timestamp: string; // ISO 8601
}
```

To wire this up, pass `onLinkClick` to `LinksBlockRenderer`:

```tsx
<LinksBlockRenderer
  blockId={block.id}
  title={block.title}
  config={block.config as LinksBlockConfig}
  onLinkClick={(blockId, itemId) => trackClick({ blockId, itemId })}
/>
```

---

## Integration with the Block Engine

The `links` type is a first-class citizen of the block engine. No parallel infrastructure exists.

| Operation         | How                                                                |
| ----------------- | ------------------------------------------------------------------ |
| Create            | `POST /api/pages/:pageId/blocks` with `type: 'links'`              |
| Update config     | `PATCH /api/blocks/:blockId` — full config replacement (not merge) |
| Reorder blocks    | `PATCH /api/pages/:pageId/blocks/reorder`                          |
| Publish/unpublish | `POST /api/blocks/:blockId/publish` / `unpublish`                  |
| Delete            | `DELETE /api/blocks/:blockId`                                      |

Auth: all endpoints require a valid JWT. Ownership is enforced via `OwnershipGuard` +
`MembershipService` (block → page → artist resolution).

Config validation runs on every write in `BlocksService` before any DB operation.

---

## Public Page Render

### Component

```tsx
// apps/web/src/features/blocks/components/LinksBlockRenderer.tsx

<LinksBlockRenderer
  blockId={block.id} // optional — needed for analytics
  title={block.title} // optional block-level heading
  config={config} // LinksBlockConfig
  onLinkClick={trackFn} // optional — wire up when analytics is ready
/>
```

### Public API shape (from `PublicPagesService`)

```ts
{
  id: string;
  type: 'links';
  title: string | null;
  position: number;
  config: {
    items: LinkItem[];  // only published blocks are returned
  }
}
```

`isPublished`, `createdAt`, `updatedAt` are never exposed publicly.

---

## Multiple Pages per Artist

Currently 1:1 (Artist ↔ Page). The block is scoped to `pageId`, not `artistId`, so no
change is needed to this block when multi-page support is added. The dashboard page
(`dashboard/page/page.tsx`) will need a page selector — see `docs/block-engine.md`.

---

## Validation Checklist (QA)

### Backend

- [ ] `POST /api/pages/:pageId/blocks` with `type: links` and valid config → 201
- [ ] Same endpoint with `items: []` → 400 (at least 1 item required)
- [ ] Item with `url: 'javascript:alert(1)'` → 400
- [ ] Item with `url: 'http://example.com'` → 201 (http allowed)
- [ ] Item with `icon: 'unknown_icon'` → 400
- [ ] Item with duplicate `id` → 400
- [ ] Item with duplicate `sortOrder` → 400
- [ ] Item with `openInNewTab: 'yes'` (string) → 400
- [ ] No auth header → 401
- [ ] Valid auth but wrong artist → 403
- [ ] 51st block on same page → 422

### Frontend

- [ ] Create block → default item appears with id and sortOrder=0
- [ ] Add second item → sortOrder=1, unique id
- [ ] Edit label/url/icon/openInNewTab → values persist on save
- [ ] Remove middle item → remaining items renumbered 0..n-1
- [ ] Move up / Move down → order updates immediately, saved correctly
- [ ] Save with empty label → backend returns 400, error shown inline
- [ ] Save with invalid URL → backend returns 400, error shown inline
- [ ] `LinksBlockRenderer` renders items in sortOrder order
- [ ] `openInNewTab: true` → link has `target="_blank" rel="noopener noreferrer"`
- [ ] `openInNewTab: false` → link has `target="_self"`, no rel

---

## Key Files

| File                                                             | Purpose                                      |
| ---------------------------------------------------------------- | -------------------------------------------- |
| `packages/types/src/block.ts`                                    | `LinkItem`, `LinksBlockConfig`, `LINK_ICONS` |
| `apps/api/src/modules/blocks/schemas/block-config.schema.ts`     | Per-field validation                         |
| `apps/web/src/features/blocks/components/BlockConfigForm.tsx`    | `LinksForm` editor                           |
| `apps/web/src/features/blocks/components/LinksBlockRenderer.tsx` | Public render component                      |
| `docs/block-engine.md`                                           | Block engine architecture reference          |

---

## Next Steps

1. **Click tracking** — implement `POST /api/analytics/clicks` endpoint, wire `onLinkClick`
   in the public page renderer. Items already carry stable `id` fields.
2. **`mailto:` / `tel:` support** — add protocols to `assertSafeUrl()` allowlist if needed.
3. **Custom icon images** — if artists need custom per-item images, add `iconUrl?: string`
   back to `LinkItem` alongside `icon`. Validate as `assertSafeUrl()`.
4. **Per-item styles** — add `style?: 'primary' | 'secondary' | 'outline'` to `LinkItem`
   for visual variants without breaking the current schema.
