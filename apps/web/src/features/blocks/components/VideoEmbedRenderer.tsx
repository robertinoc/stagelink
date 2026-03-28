import type { VideoEmbedBlockConfig } from '@stagelink/types';

// ─── Allow attributes per provider ───────────────────────────────────────────
//
// youtube  — autoplay + fullscreen + pip for a full playback experience
// vimeo    — autoplay + fullscreen + pip
// tiktok   — encrypted-media (DRM); no fullscreen API exposed by TikTok embed
//
// NOTE: TikTok embeds work in most browsers but may be blocked by strict
// content-security-policy headers. The embed URL pattern is:
//   https://www.tiktok.com/embed/v2/{videoId}

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
 * embedUrl is pre-derived by the backend from sourceUrl — this component
 * renders it directly without any client-side URL conversion.
 *
 * Usage (dashboard preview / public page):
 *   <VideoEmbedRenderer title={block.title} config={block.config as VideoEmbedBlockConfig} />
 */
export function VideoEmbedRenderer({ title, config }: VideoEmbedRendererProps) {
  const { embedUrl, provider } = config;

  if (!embedUrl) {
    return <EmbedUnavailable />;
  }

  return (
    <div className="space-y-3">
      {title && <h3 className="text-center text-base font-semibold">{title}</h3>}
      {/* 16:9 responsive wrapper */}
      <div className="relative w-full overflow-hidden rounded-xl" style={{ paddingTop: '56.25%' }}>
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
    </div>
  );
}
