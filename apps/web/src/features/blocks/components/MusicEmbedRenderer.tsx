import type { MusicEmbedBlockConfig } from '@stagelink/types';

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

// ─── Allow attributes per provider ───────────────────────────────────────────
//
// autoplay        — needed by the provider's built-in play button
// clipboard-write — Spotify/Apple Music copy-to-clipboard features
// encrypted-media — DRM-protected audio (all providers)
// fullscreen      — expand button within the embed
// picture-in-picture — floating playback (YouTube)

const PROVIDER_ALLOW: Record<MusicEmbedBlockConfig['provider'], string> = {
  spotify: 'autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture',
  apple_music: 'autoplay; encrypted-media',
  soundcloud: 'autoplay',
  youtube: 'autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture',
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
 * embedUrl is pre-derived by the backend from sourceUrl — this component
 * renders it directly without any client-side URL conversion.
 *
 * Usage (dashboard preview / public page):
 *   <MusicEmbedRenderer title={block.title} config={block.config as MusicEmbedBlockConfig} />
 */
export function MusicEmbedRenderer({ title, config }: MusicEmbedRendererProps) {
  const { embedUrl, provider } = config;
  const heightMode = PROVIDER_HEIGHT[provider];

  if (!embedUrl) {
    return <EmbedUnavailable />;
  }

  return (
    <div className="space-y-3">
      {title && <h3 className="text-center text-base font-semibold">{title}</h3>}
      {heightMode === 'aspect' ? (
        // 16:9 responsive wrapper (YouTube)
        <div
          className="relative w-full overflow-hidden rounded-xl"
          style={{ paddingTop: '56.25%' }}
        >
          <iframe
            src={embedUrl}
            title={title ?? provider}
            className="absolute inset-0 h-full w-full"
            frameBorder="0"
            allow={PROVIDER_ALLOW[provider]}
            allowFullScreen
            loading="lazy"
          />
        </div>
      ) : (
        <iframe
          src={embedUrl}
          title={title ?? provider}
          width="100%"
          height={heightMode}
          className="rounded-xl"
          frameBorder="0"
          allow={PROVIDER_ALLOW[provider]}
          loading="lazy"
        />
      )}
    </div>
  );
}
