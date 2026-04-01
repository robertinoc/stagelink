# Music & Video Embed Blocks

Technical reference for `music_embed` and `video_embed` block types.

## Design principles

- **Client sends `sourceUrl`** — the share URL the user pastes (e.g. `https://open.spotify.com/track/…`).
- **Backend derives `embedUrl`** — the iframe-safe URL. The client never constructs or sends embed URLs directly.
- **`resourceType` is inferred** — from the path of `sourceUrl`. Never sent by the client.
- **Provider is explicit** — selected from a dropdown, never inferred from the URL.

## Config shapes

```ts
interface MusicEmbedBlockConfig {
  provider: 'spotify' | 'apple_music' | 'soundcloud' | 'youtube';
  sourceUrl: string; // persisted share URL — what the user pasted
  embedUrl: string; // derived by backend; rendered directly by client
  resourceType: MusicResourceType; // 'track' | 'album' | 'playlist' | 'artist' | 'episode' | 'set'
}

interface VideoEmbedBlockConfig {
  provider: 'youtube' | 'vimeo' | 'tiktok';
  sourceUrl: string; // persisted share URL
  embedUrl: string; // derived by backend
  resourceType: VideoResourceType; // 'video' | 'short'
}
```

## Backend flow

```
POST /blocks  { type: 'music_embed', config: { provider, sourceUrl } }
  → validateBlockConfig   — checks provider in allowlist; assertSafeUrl(sourceUrl)
  → enrichBlockConfig     — parses sourceUrl → derives embedUrl + resourceType
  → sanitizeBlockConfig   — trims whitespace from link URLs (no-op for embed blocks)
  → prisma.block.create   — writes { provider, sourceUrl, embedUrl, resourceType }
```

`enrichBlockConfig` is in `apps/api/src/modules/blocks/schemas/block-config.schema.ts`.
`validateBlockConfig` and `enrichBlockConfig` are both called from `BlocksService.create()` and `BlocksService.update()`.

## URL parsing per provider

### Spotify

| Input pattern                    | embedUrl                               |
| -------------------------------- | -------------------------------------- |
| `open.spotify.com/track/{id}`    | `open.spotify.com/embed/track/{id}`    |
| `open.spotify.com/album/{id}`    | `open.spotify.com/embed/album/{id}`    |
| `open.spotify.com/playlist/{id}` | `open.spotify.com/embed/playlist/{id}` |
| `open.spotify.com/artist/{id}`   | `open.spotify.com/embed/artist/{id}`   |
| `open.spotify.com/episode/{id}`  | `open.spotify.com/embed/episode/{id}`  |

Query parameters (e.g. `?si=…`) are stripped from the embed URL.

### Apple Music

| Input pattern                          | embedUrl                                     |
| -------------------------------------- | -------------------------------------------- |
| `music.apple.com/{country}/album/…`    | `embed.music.apple.com/{country}/album/…`    |
| `music.apple.com/{country}/playlist/…` | `embed.music.apple.com/{country}/playlist/…` |

Hostname swapped from `music.apple.com` → `embed.music.apple.com`. Pathname preserved as-is.

> **Limitation**: Apple Music embeds require the viewer to have an Apple Music subscription or free trial to play full tracks. Preview clips play without authentication.

### SoundCloud

SoundCloud uses a widget player URL. The original `sourceUrl` is passed as a query parameter:

```
https://w.soundcloud.com/player/?url={encoded_sourceUrl}&visual=true&hide_related=true
  &show_comments=false&show_user=true&show_reposts=false&auto_play=false
```

`resourceType` is inferred:

- `/user/sets/…` → `set` (playlist)
- `/user` (single segment) → `artist`
- `/user/track` → `track` (default)

### YouTube (music_embed)

Handles all YouTube share URL formats. `resourceType` is always `track` for music context.

| Input pattern              | videoId extraction        |
| -------------------------- | ------------------------- |
| `youtu.be/{id}`            | pathname segment 1        |
| `youtube.com/watch?v={id}` | query param `v`           |
| `youtube.com/shorts/{id}`  | pathname after `/shorts/` |

→ `https://www.youtube.com/embed/{videoId}`

### YouTube (video_embed)

Same URL parsing as above, but `resourceType` is `short` for `/shorts/` URLs, `video` otherwise.

### Vimeo

| Input pattern           | embedUrl                               |
| ----------------------- | -------------------------------------- |
| `vimeo.com/{id}`        | `player.vimeo.com/video/{id}`          |
| `vimeo.com/{id}/{hash}` | `player.vimeo.com/video/{id}?h={hash}` |

The numeric ID must be all digits. The optional hash (hex string) is preserved to support private videos.

### TikTok

| Input pattern                   | embedUrl                   |
| ------------------------------- | -------------------------- |
| `tiktok.com/@{user}/video/{id}` | `tiktok.com/embed/v2/{id}` |

The video ID is extracted with `/\/video\/(\d+)/`.

> **Limitation**: TikTok embeds may be blocked by strict Content-Security-Policy headers. `resourceType` is always `video`.

## Iframe security (`allow` attributes)

Each provider uses a minimal `allow` attribute:

| Provider    | `allow`                                                                      |
| ----------- | ---------------------------------------------------------------------------- |
| Spotify     | `autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture` |
| Apple Music | `autoplay; encrypted-media`                                                  |
| SoundCloud  | `autoplay`                                                                   |
| YouTube     | `autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture` |
| Vimeo       | `autoplay; fullscreen; picture-in-picture`                                   |
| TikTok      | `encrypted-media`                                                            |

No `allow-scripts` or `allow-same-origin` sandbox flags are used — providers are trusted third parties.

## Renderer behavior

- Renderers (`MusicEmbedRenderer`, `VideoEmbedRenderer`) use `config.embedUrl` directly — no client-side URL parsing.
- If `embedUrl` is empty (e.g. for a block saved before enrichment), an `EmbedUnavailable` placeholder is shown.
- Music embed heights: Spotify 352px, Apple Music 175px, SoundCloud 300px, YouTube 16:9 aspect ratio.
- Video embeds are always 16:9 via `paddingTop: '56.25%'`.

## Error handling

`enrichBlockConfig` throws `BadRequestException` for:

- URL that cannot be parsed by `new URL()`
- Hostname that doesn't match the selected provider
- Missing video/track ID in the path

These errors surface as HTTP 400 from the blocks controller.

## QA checklist

### Spotify

- [ ] Track URL → iframe renders at 352px
- [ ] Album URL → iframe renders at 352px
- [ ] Playlist URL → iframe renders at 352px
- [ ] URL with `?si=` tracking param → embed URL has no query params
- [ ] Non-Spotify URL with provider=spotify → 400

### Apple Music

- [ ] Album URL → iframe renders at 175px
- [ ] Playlist URL → iframe renders at 175px
- [ ] Non-Apple Music URL with provider=apple_music → 400

### SoundCloud

- [ ] Track URL → widget iframe renders at 300px
- [ ] Sets/playlist URL → resourceType=set
- [ ] Artist URL (single path segment) → resourceType=artist
- [ ] Non-SoundCloud URL with provider=soundcloud → 400

### YouTube (music)

- [ ] `youtube.com/watch?v=ID` → renders
- [ ] `youtu.be/ID` → renders
- [ ] Non-YouTube URL with provider=youtube → 400

### YouTube (video)

- [ ] `/watch?v=ID` → resourceType=video, 16:9 iframe
- [ ] `/shorts/ID` → resourceType=short, 16:9 iframe
- [ ] `youtu.be/ID` → resourceType=video, 16:9 iframe

### Vimeo

- [ ] `vimeo.com/{id}` → 16:9 iframe
- [ ] `vimeo.com/{id}/{hash}` → embed URL includes `?h={hash}`
- [ ] Non-numeric ID → 400
- [ ] Non-Vimeo URL → 400

### TikTok

- [ ] `tiktok.com/@user/video/{id}` → 16:9 iframe
- [ ] URL without `/video/` segment → 400

### Form UX

- [ ] Changing provider resets sourceUrl (no stale URL from previous provider)
- [ ] Hint text updates when provider changes
- [ ] Saving with empty sourceUrl → 400 from backend

### Security

- [ ] `javascript:` URL → rejected by `assertSafeUrl`
- [ ] `data:` URL → rejected
- [ ] Valid-looking URL for wrong provider → rejected by `enrichBlockConfig`
