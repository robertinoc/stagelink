import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { resolveApiBaseUrl } from '@/lib/server/api-base-url';
import type { StageLinkInsightsDashboard, StageLinkInsightsPlatform } from '@stagelink/types';

// =============================================================
// GET /api/blocks/latest-embed
//
// Resolves the "latest" embed URL for a given platform + artist.
//
// Query params:
//   platform  — 'youtube' | 'soundcloud'
//   artistId  — the artist's UUID
//
// Returns:
//   { embedUrl: string }                   — on success
//   { embedUrl: null, reason: string }      — no snapshot / no content
//   { comingSoon: true }                    — platform not yet implemented (SoundCloud)
//
// Security:
//   - Requires an authenticated session.
//   - Fetches the dashboard via the NestJS API (forwarding Bearer token).
//   - The NestJS OwnershipGuard ensures the session user owns the artist.
// =============================================================

const SUPPORTED_PLATFORMS: StageLinkInsightsPlatform[] = ['youtube', 'soundcloud'];

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const platform = searchParams.get('platform') as StageLinkInsightsPlatform | null;
  const artistId = searchParams.get('artistId');

  // Validate required params
  if (!platform || !SUPPORTED_PLATFORMS.includes(platform)) {
    return NextResponse.json(
      { message: `platform must be one of: ${SUPPORTED_PLATFORMS.join(', ')}` },
      { status: 400 },
    );
  }

  if (!artistId || typeof artistId !== 'string' || artistId.trim().length === 0) {
    return NextResponse.json({ message: 'artistId is required' }, { status: 400 });
  }

  // SoundCloud latest track is not yet implemented
  if (platform === 'soundcloud') {
    return NextResponse.json({ comingSoon: true });
  }

  const apiBaseUrl = resolveApiBaseUrl();
  if (!apiBaseUrl) {
    return NextResponse.json(
      { message: 'Insights API is not configured on this deployment.' },
      { status: 500 },
    );
  }

  try {
    const response = await fetch(
      `${apiBaseUrl}/api/insights/${encodeURIComponent(artistId)}/dashboard`,
      {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${session.accessToken}`,
        },
        cache: 'no-store',
      },
    );

    if (response.status === 401 || response.status === 403) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    if (!response.ok) {
      return NextResponse.json({ embedUrl: null, reason: 'Could not fetch insights data.' });
    }

    const dashboard = (await response.json()) as StageLinkInsightsDashboard;

    // Find the platform summary for YouTube
    const platformSummary = dashboard.platforms.find((p) => p.platform === 'youtube');

    if (!platformSummary || !platformSummary.connection) {
      return NextResponse.json({
        embedUrl: null,
        reason: 'No YouTube channel connected.',
      });
    }

    if (!platformSummary.latestSnapshot) {
      return NextResponse.json({
        embedUrl: null,
        reason: 'No snapshot data available yet. Try syncing your YouTube channel.',
      });
    }

    const topItem = platformSummary.latestSnapshot.topContent?.[0];

    if (!topItem || !topItem.externalId) {
      return NextResponse.json({
        embedUrl: null,
        reason: 'No video content found in your YouTube channel data.',
      });
    }

    const embedUrl = `https://www.youtube.com/embed/${topItem.externalId}`;
    return NextResponse.json({ embedUrl });
  } catch (error) {
    console.error('[blocks][latest-embed] Failed to resolve latest embed', error);
    return NextResponse.json({
      embedUrl: null,
      reason: 'Could not resolve latest embed right now.',
    });
  }
}
