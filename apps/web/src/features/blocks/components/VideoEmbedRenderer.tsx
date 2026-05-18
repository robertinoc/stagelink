'use client';

import { useEffect, useState } from 'react';
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

function EmbedUnavailable({ message }: { message?: string }) {
  return (
    <div className="flex h-20 items-center justify-center rounded-xl border border-dashed border-border text-sm text-muted-foreground">
      {message ?? 'Preview unavailable'}
    </div>
  );
}

// ─── Loading placeholder ──────────────────────────────────────────────────────

function EmbedLoading() {
  return (
    <div
      className="relative w-full overflow-hidden rounded-xl bg-muted/20"
      style={{ paddingTop: '56.25%' }}
    >
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    </div>
  );
}

// ─── Latest embed resolver hook ───────────────────────────────────────────────

interface LatestEmbedResult {
  embedUrl: string | null;
  comingSoon?: boolean;
  reason?: string;
  loading: boolean;
}

function useLatestEmbed(
  platform: 'youtube' | 'soundcloud',
  artistId: string | undefined,
): LatestEmbedResult {
  const [state, setState] = useState<LatestEmbedResult>({ embedUrl: null, loading: true });

  useEffect(() => {
    if (!artistId) {
      setState({ embedUrl: null, loading: false, reason: 'No artist ID provided.' });
      return;
    }

    let cancelled = false;

    async function resolve() {
      setState((prev) => ({ ...prev, loading: true }));
      try {
        const params = new URLSearchParams({ platform, artistId: artistId! });
        const res = await fetch(`/api/blocks/latest-embed?${params.toString()}`, {
          cache: 'no-store',
        });
        if (!res.ok) {
          if (!cancelled)
            setState({ embedUrl: null, loading: false, reason: 'Could not load embed.' });
          return;
        }
        const data = (await res.json()) as {
          embedUrl?: string;
          comingSoon?: boolean;
          reason?: string;
        };
        if (!cancelled) {
          setState({
            embedUrl: data.embedUrl ?? null,
            comingSoon: data.comingSoon,
            reason: data.reason,
            loading: false,
          });
        }
      } catch {
        if (!cancelled)
          setState({ embedUrl: null, loading: false, reason: 'Could not load embed.' });
      }
    }

    void resolve();
    return () => {
      cancelled = true;
    };
  }, [platform, artistId]);

  return state;
}

// ─── Renderer ─────────────────────────────────────────────────────────────────

interface VideoEmbedRendererProps {
  title?: string | null;
  config: VideoEmbedBlockConfig;
  /**
   * Required when config.mode === 'latest_video' to resolve the embed URL
   * from the artist's connected YouTube channel.
   */
  artistId?: string;
}

/**
 * Renders a video embed block in a 16:9 responsive container.
 *
 * For mode === 'latest_video' (YouTube): resolves the embed URL from the
 * artist's insights snapshot via /api/blocks/latest-embed. This requires
 * the `artistId` prop to be passed down.
 *
 * For mode === 'manual' (or absent): embedUrl is pre-derived by the backend
 * from sourceUrl — renders directly without any client-side URL conversion.
 *
 * Usage (dashboard preview / public page):
 *   <VideoEmbedRenderer title={block.title} config={block.config as VideoEmbedBlockConfig} artistId={artistId} />
 */
export function VideoEmbedRenderer({ title, config, artistId }: VideoEmbedRendererProps) {
  const mode = config.mode ?? 'manual';
  const isLatestMode = mode === 'latest_video';
  // 'playlist' mode uses a pre-derived embedUrl stored in config (set by backend on save).
  // No client-side resolution needed — same behaviour as 'manual'.

  // Resolve latest embed URL when in latest_video mode
  const latest = useLatestEmbed(
    // Only fetch when in latest mode
    isLatestMode ? 'youtube' : 'youtube',
    isLatestMode ? artistId : undefined,
  );

  const resolvedEmbedUrl = isLatestMode ? latest.embedUrl : config.embedUrl;
  const isLoading = isLatestMode && latest.loading;

  if (isLoading) {
    return (
      <div className="space-y-3">
        {title && <h3 className="text-center text-base font-semibold">{title}</h3>}
        <EmbedLoading />
      </div>
    );
  }

  if (isLatestMode && latest.comingSoon) {
    return (
      <div className="space-y-3">
        {title && <h3 className="text-center text-base font-semibold">{title}</h3>}
        <EmbedUnavailable message="Coming soon" />
      </div>
    );
  }

  if (!resolvedEmbedUrl) {
    const message = isLatestMode
      ? (latest.reason ?? 'Connect your YouTube channel to show your latest video.')
      : undefined;
    return (
      <div className="space-y-3">
        {title && <h3 className="text-center text-base font-semibold">{title}</h3>}
        <EmbedUnavailable message={message} />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {title && <h3 className="text-center text-base font-semibold">{title}</h3>}
      {/* 16:9 responsive wrapper */}
      <div className="relative w-full overflow-hidden rounded-xl" style={{ paddingTop: '56.25%' }}>
        <iframe
          src={resolvedEmbedUrl}
          title={title ?? config.provider}
          className="absolute inset-0 h-full w-full"
          frameBorder="0"
          allow={PROVIDER_ALLOW[config.provider]}
          allowFullScreen
          loading="lazy"
        />
      </div>
    </div>
  );
}
