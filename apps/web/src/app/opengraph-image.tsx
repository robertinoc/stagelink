import { ImageResponse } from 'next/og';

export const alt = 'StageLink artist page and music link platform';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default function Image() {
  return new ImageResponse(
    <div
      style={{
        alignItems: 'center',
        background:
          'radial-gradient(circle at 22% 22%, rgba(155, 48, 208, 0.42), transparent 32%), linear-gradient(135deg, #0b0b0f 0%, #161024 48%, #241037 100%)',
        color: 'white',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'Inter, Arial, sans-serif',
        height: '100%',
        justifyContent: 'center',
        padding: '76px',
        width: '100%',
      }}
    >
      <div
        style={{
          color: '#f5e7ff',
          display: 'flex',
          fontSize: 88,
          fontWeight: 800,
          letterSpacing: 0,
          lineHeight: 1,
          marginBottom: 30,
        }}
      >
        StageLink
      </div>
      <div
        style={{
          color: 'rgba(255,255,255,0.9)',
          display: 'flex',
          fontSize: 42,
          fontWeight: 600,
          lineHeight: 1.18,
          maxWidth: 820,
          textAlign: 'center',
        }}
      >
        One artist page for music, press kits, merch, links, and audience growth.
      </div>
    </div>,
    size,
  );
}
