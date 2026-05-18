import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { resolveApiBaseUrl } from '@/lib/server/api-base-url';

// =============================================================
// GET /api/blocks/youtube-playlists?artistId=:id
//
// Returns the public playlists from the artist's connected YouTube channel.
// Used by the video_embed block 'playlist' mode picker in the dashboard editor.
//
// Query params:
//   artistId — the artist's UUID
//
// Returns:
//   Array of { id, title, thumbnailUrl, itemCount } on success.
//   Empty array when no YouTube channel is connected.
//
// Security:
//   - Requires an authenticated session.
//   - The NestJS OwnershipGuard ensures the session user owns the artist.
// =============================================================

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const artistId = searchParams.get('artistId');

  if (!artistId || typeof artistId !== 'string' || artistId.trim().length === 0) {
    return NextResponse.json({ message: 'artistId is required' }, { status: 400 });
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
      `${apiBaseUrl}/api/insights/${encodeURIComponent(artistId)}/youtube/playlists`,
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
      const text = await response.text().catch(() => '');
      console.error(`[blocks][youtube-playlists] API error ${response.status}: ${text}`);
      return NextResponse.json([], { status: 200 }); // Graceful fallback — return empty array
    }

    const playlists = await response.json();
    return NextResponse.json(playlists);
  } catch (error) {
    console.error('[blocks][youtube-playlists] Failed to fetch playlists', error);
    return NextResponse.json([], { status: 200 }); // Graceful fallback
  }
}
