import { ImageResponse } from 'next/og';
import type { NextRequest } from 'next/server';
import { OG_ARTIST_LIMITS } from '@/lib/og-image';

export const contentType = 'image/png';

/**
 * GET /api/og/artist?name=<displayName>&handle=<username>
 *
 * Dynamic Open Graph image for artists with no cover or avatar. Renders a
 * branded 1200×630 card with the artist's name + @handle so shared links still
 * look intentional. Inputs come from query params (already-public values passed
 * by `buildPublicArtistMetadata`); they are truncated here as defense-in-depth.
 *
 * Output is an image, not HTML — query text cannot inject markup.
 */
export function GET(request: NextRequest): ImageResponse {
  const { searchParams } = new URL(request.url);
  const name = (searchParams.get('name') ?? 'StageLink Artist').slice(0, OG_ARTIST_LIMITS.name);
  const handleRaw = (searchParams.get('handle') ?? '').slice(0, OG_ARTIST_LIMITS.handle);
  const handle = handleRaw ? `@${handleRaw.replace(/^@+/, '')}` : '';

  return new ImageResponse(
    <div
      style={{
        alignItems: 'flex-start',
        background:
          'radial-gradient(circle at 22% 22%, rgba(155, 48, 208, 0.42), transparent 32%), linear-gradient(135deg, #0b0b0f 0%, #161024 48%, #241037 100%)',
        color: 'white',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'Inter, Arial, sans-serif',
        height: '100%',
        justifyContent: 'space-between',
        padding: '76px',
        width: '100%',
      }}
    >
      <div
        style={{
          color: '#f5e7ff',
          display: 'flex',
          fontSize: 44,
          fontWeight: 800,
          letterSpacing: 0,
        }}
      >
        StageLink
      </div>

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div
          style={{
            color: 'white',
            display: 'flex',
            fontSize: 96,
            fontWeight: 800,
            lineHeight: 1.05,
            maxWidth: 1040,
          }}
        >
          {name}
        </div>
        {handle ? (
          <div
            style={{
              color: 'rgba(245,231,255,0.72)',
              display: 'flex',
              fontSize: 42,
              fontWeight: 600,
              marginTop: 18,
            }}
          >
            {handle}
          </div>
        ) : null}
      </div>

      <div
        style={{
          color: 'rgba(255,255,255,0.6)',
          display: 'flex',
          fontSize: 30,
          fontWeight: 500,
        }}
      >
        Artist page · Press kit · Merch · Links
      </div>
    </div>,
    { width: 1200, height: 630 },
  );
}
