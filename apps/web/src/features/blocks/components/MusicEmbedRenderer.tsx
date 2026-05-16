'use client';

import { useEffect, useState } from 'react';
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

function EmbedUnavailable({ message }: { message?: string }) {
  return (
    <div className="flex h-20 items-center justify-center rounded-xl border border-dashed border-border text-sm text-muted-foreground">
      {message ?? 'Preview unavailable'}
    </div>
  );
}

// ─── Loading placeholder ──────────────────────────────────────────────────────

function EmbedLoading({ height }: { height: number | 'aspect' }) {
  if (height === 'aspect') {
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
  return (
    <div className="flex items-center justify-center rounded-xl bg-muted/20" style={{ height }}>
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
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

interface MusicEmbedRendererProps {
  title?: string | null;
  config: MusicEmbedBlockConfig;
  /**
   * Required when config.mode === 'latest_track' to resolve the embed URL
   * from the artist's connected platform channel.
   */
  artistId?: string;
}

/**
 * Renders a music embed block.
 *
 * For mode === 'latest_track' (YouTube): resolves the embed URL from the
 * artist's insights snapshot via /api/blocks/latest-embed.
 * For mode === 'latest_track' (SoundCloud): renders a "coming soon" placeholder.
 * For mode === 'manual' (or absent): embedUrl is pre-derived by the backend
 * from sourceUrl — renders directly without any client-side URL conversion.
 *
 * Usage (dashboard preview / public page):
 *   <MusicEmbedRenderer title={block.title} config={block.config as MusicEmbedBlockConfig} artistId={artistId} />
 */
export function MusicEmbedRenderer({ title, config, artistId }: MusicEmbedRendererProps) {
  const { provider } = config;
  const mode = config.mode ?? 'manual';
  const heightMode = PROVIDER_HEIGHT[provider];
  const isLatestMode = mode === 'latest_track';
  const isSoundCloudLatest = isLatestMode && provider === 'soundcloud';
  const isYouTubeLatest = isLatestMode && provider === 'youtube';

  // Resolve latest embed URL for YouTube latest_track mode
  const latest = useLatestEmbed(
    provider === 'youtube' ? 'youtube' : 'soundcloud',
    isLatestMode && !isSoundCloudLatest ? artistId : undefined,
  );

  const resolvedEmbedUrl = isLatestMode ? latest.embedUrl : config.embedUrl;
  const isLoading = isYouTubeLatest && latest.loading;

  // SoundCloud latest_track — not yet implemented
  if (isSoundCloudLatest) {
    return (
      <div className="space-y-3">
        {title && <h3 className="text-center text-base font-semibold">{title}</h3>}
        <EmbedUnavailable message="Automatic latest track — coming soon" />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        {title && <h3 className="text-center text-base font-semibold">{title}</h3>}
        <EmbedLoading height={heightMode} />
      </div>
    );
  }

  if (!resolvedEmbedUrl) {
    const message = isLatestMode
      ? (latest.reason ?? 'Connect your YouTube channel to show your latest track.')
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
      {heightMode === 'aspect' ? (
        // 16:9 responsive wrapper (YouTube)
        <div
          className="relative w-full overflow-hidden rounded-xl"
          style={{ paddingTop: '56.25%' }}
        >
          <iframe
            src={resolvedEmbedUrl}
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
          src={resolvedEmbedUrl}
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
