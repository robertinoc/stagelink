import type { VideoEmbedBlockConfig } from '@stagelink/types';

// ─── URL conversion ───────────────────────────────────────────────────────────
//
// Converts a share URL into an embed URL.
// Returns null if the URL can't be parsed — caller renders a placeholder.

function toEmbedUrl(provider: VideoEmbedBlockConfig['provider'], shareUrl: string): string | null {
  try {
    const url = new URL(shareUrl);

    switch (provider) {
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

      case 'vimeo': {
        // https://vimeo.com/{id} or https://vimeo.com/{id}/{hash}
        if (!url.hostname.includes('vimeo.com')) return null;
        const parts = url.pathname.split('/').filter(Boolean);
        const videoId = parts[0];
        if (!videoId) return null;
        // Preserve private video hash if present
        const hash = parts[1];
        const hashParam = hash ? `?h=${hash}` : '';
        return `https://player.vimeo.com/video/${videoId}${hashParam}`;
      }

      case 'tiktok': {
        // https://www.tiktok.com/@{user}/video/{id}
        if (!url.hostname.includes('tiktok.com')) return null;
        const match = url.pathname.match(/\/video\/(\d+)/);
        const videoId = match?.[1];
        if (!videoId) return null;
        return `https://www.tiktok.com/embed/v2/${videoId}`;
      }
    }
  } catch {
    return null;
  }
}

// ─── Allow attributes per provider ───────────────────────────────────────────

const PROVIDER_ALLOW: Record<VideoEmbedBlockConfig['provider'], string> = {
  youtube: 'autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture',
  vimeo: 'autoplay; fullscreen; picture-in-picture',
  tiktok: 'encrypted-media',
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

interface VideoEmbedRendererProps {
  title?: string | null;
  config: VideoEmbedBlockConfig;
}

/**
 * Renders a video embed block in a 16:9 responsive container.
 *
 * Usage (dashboard preview / public page):
 *   <VideoEmbedRenderer title={block.title} config={block.config as VideoEmbedBlockConfig} />
 */
export function VideoEmbedRenderer({ title, config }: VideoEmbedRendererProps) {
  const embedUrl = toEmbedUrl(config.provider, config.embedUrl);

  return (
    <div className="space-y-3">
      {title && <h3 className="text-center text-base font-semibold">{title}</h3>}
      {embedUrl ? (
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
            allow={PROVIDER_ALLOW[config.provider]}
            allowFullScreen
            loading="lazy"
          />
        </div>
      ) : (
        <EmbedUnavailable />
      )}
    </div>
  );
}
