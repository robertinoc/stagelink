import type { MusicEmbedBlockConfig } from '@stagelink/types';

// ─── URL conversion ───────────────────────────────────────────────────────────
//
// Converts a share URL (what the user pastes) into an embed URL.
// Returns null if the URL can't be parsed — caller renders a placeholder.
//
// To add a provider:
//   1. Add the value to MusicEmbedBlockConfig['provider'] in @stagelink/types
//   2. Add a case here
//   3. Add validation in block-config.schema.ts (MUSIC_PROVIDERS)

function toEmbedUrl(provider: MusicEmbedBlockConfig['provider'], shareUrl: string): string | null {
  try {
    const url = new URL(shareUrl);

    switch (provider) {
      case 'spotify': {
        // https://open.spotify.com/{type}/{id}?si=... → https://open.spotify.com/embed/{type}/{id}
        if (url.hostname !== 'open.spotify.com') return null;
        return `https://open.spotify.com/embed${url.pathname}`;
      }

      case 'apple_music': {
        // https://music.apple.com/{country}/...  → https://embed.music.apple.com/{country}/...
        if (!url.hostname.endsWith('music.apple.com')) return null;
        return `https://embed.music.apple.com${url.pathname}`;
      }

      case 'soundcloud': {
        // SoundCloud uses a widget player — pass the original URL as a param.
        const params = new URLSearchParams({
          url: shareUrl,
          visual: 'true',
          hide_related: 'true',
          show_comments: 'false',
          show_user: 'true',
          show_reposts: 'false',
          auto_play: 'false',
        });
        return `https://w.soundcloud.com/player/?${params.toString()}`;
      }

      case 'youtube': {
        // Handles: youtube.com/watch?v=ID, youtu.be/ID, youtube.com/shorts/ID
        let videoId: string | null = null;
        if (url.hostname === 'youtu.be') {
          videoId = url.pathname.slice(1).split('/')[0] ?? null;
        } else if (url.hostname.includes('youtube.com')) {
          videoId = url.searchParams.get('v');
          if (!videoId && url.pathname.startsWith('/shorts/')) {
            videoId = url.pathname.replace('/shorts/', '').split('/')[0] ?? null;
          }
        }
        if (!videoId) return null;
        return `https://www.youtube.com/embed/${videoId}`;
      }
    }
  } catch {
    return null;
  }
}

// ─── Heights per provider ─────────────────────────────────────────────────────
//
// Spotify: 352px covers tracks, albums, playlists and artists.
// Apple Music: 175px is the standard widget height.
// SoundCloud: 300px for visual (waveform) mode.
// YouTube: 16:9 aspect ratio via padding trick.

const PROVIDER_HEIGHT: Record<MusicEmbedBlockConfig['provider'], number | 'aspect'> = {
  spotify: 352,
  apple_music: 175,
  soundcloud: 300,
  youtube: 'aspect',
};

// ─── Unavailable placeholder ──────────────────────────────────────────────────

function EmbedUnavailable() {
  return (
    <div className="flex h-20 items-center justify-center rounded-xl border border-dashed border-border text-sm text-muted-foreground">
      Preview unavailable
    </div>
  );
}

// ─── Renderer ─────────────────────────────────────────────────────────────────

interface MusicEmbedRendererProps {
  title?: string | null;
  config: MusicEmbedBlockConfig;
}

/**
 * Renders a music embed block.
 *
 * Usage (dashboard preview / public page):
 *   <MusicEmbedRenderer title={block.title} config={block.config as MusicEmbedBlockConfig} />
 */
export function MusicEmbedRenderer({ title, config }: MusicEmbedRendererProps) {
  const embedUrl = toEmbedUrl(config.provider, config.embedUrl);
  const heightMode = PROVIDER_HEIGHT[config.provider];

  return (
    <div className="space-y-3">
      {title && <h3 className="text-center text-base font-semibold">{title}</h3>}
      {embedUrl ? (
        heightMode === 'aspect' ? (
          // 16:9 responsive wrapper
          <div
            className="relative w-full overflow-hidden rounded-xl"
            style={{ paddingTop: '56.25%' }}
          >
            <iframe
              src={embedUrl}
              title={title ?? config.provider}
              className="absolute inset-0 h-full w-full"
              frameBorder="0"
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              loading="lazy"
            />
          </div>
        ) : (
          <iframe
            src={embedUrl}
            title={title ?? config.provider}
            width="100%"
            height={heightMode}
            className="rounded-xl"
            frameBorder="0"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
          />
        )
      ) : (
        <EmbedUnavailable />
      )}
    </div>
  );
}
