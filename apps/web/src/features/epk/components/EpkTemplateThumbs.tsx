'use client';

// SVG thumbnail previews for each EPK template.
// Rendered at fixed size (160×100); scale with CSS as needed.

interface ThumbProps {
  /** Optional active brand colors (used only by the brutalist thumb). */
  primary?: string;
  secondary?: string;
  bg?: string;
  ink?: string;
}

// ── Studio ────────────────────────────────────────────────────────────────────
// Clean, editorial layout: white card, subtle lines, centred hero circle.
export function StudioThumb() {
  return (
    <svg
      viewBox="0 0 160 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'block', width: '100%', height: '100%' }}
      aria-hidden="true"
    >
      {/* Background */}
      <rect width="160" height="100" fill="#F8F6F2" />
      {/* Top strip accent */}
      <rect width="160" height="4" fill="#1A1A1A" />
      {/* Hero avatar circle */}
      <circle cx="80" cy="36" r="18" fill="#D6D0C8" />
      <circle cx="80" cy="36" r="10" fill="#BFBAB1" />
      {/* Artist name line */}
      <rect x="50" y="60" width="60" height="4" rx="2" fill="#1A1A1A" />
      {/* Subtitle line */}
      <rect x="60" y="68" width="40" height="2.5" rx="1.25" fill="#9E9E9E" />
      {/* Tag pills */}
      <rect x="22" y="80" width="30" height="6" rx="3" fill="#E0DAD0" />
      <rect x="56" y="80" width="24" height="6" rx="3" fill="#E0DAD0" />
      <rect x="84" y="80" width="30" height="6" rx="3" fill="#E0DAD0" />
      <rect x="118" y="80" width="20" height="6" rx="3" fill="#E0DAD0" />
    </svg>
  );
}

// ── Cinematic ─────────────────────────────────────────────────────────────────
// Full-bleed dark hero, gradient overlay, bold white type.
export function CinematicThumb() {
  return (
    <svg
      viewBox="0 0 160 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'block', width: '100%', height: '100%' }}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="cin-bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0D0018" />
          <stop offset="100%" stopColor="#1A0032" />
        </linearGradient>
        <linearGradient id="cin-overlay" x1="0" y1="0" x2="0" y2="1">
          <stop offset="40%" stopColor="transparent" stopOpacity="0" />
          <stop offset="100%" stopColor="#0D0018" stopOpacity="0.95" />
        </linearGradient>
        <linearGradient id="cin-accent" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#9B30D0" />
          <stop offset="100%" stopColor="#E040FB" />
        </linearGradient>
      </defs>
      {/* Dark background */}
      <rect width="160" height="100" fill="url(#cin-bg)" />
      {/* Simulated hero image texture */}
      <rect x="0" y="0" width="160" height="70" fill="#2A0050" opacity="0.6" />
      <ellipse cx="80" cy="30" rx="60" ry="35" fill="#6B10C0" opacity="0.2" />
      {/* Gradient overlay */}
      <rect width="160" height="100" fill="url(#cin-overlay)" />
      {/* Purple accent bar bottom-left */}
      <rect x="16" y="65" width="32" height="2" rx="1" fill="url(#cin-accent)" />
      {/* Artist name */}
      <rect x="16" y="71" width="64" height="5" rx="2" fill="white" opacity="0.9" />
      {/* Tagline */}
      <rect x="16" y="80" width="44" height="3" rx="1.5" fill="white" opacity="0.4" />
      {/* Right: link pills */}
      <rect x="104" y="70" width="40" height="6" rx="3" fill="white" opacity="0.12" />
      <rect x="104" y="80" width="30" height="6" rx="3" fill="white" opacity="0.12" />
    </svg>
  );
}

// ── Press Bureau (brutalist) ──────────────────────────────────────────────────
// Bold, high-contrast; uses brand colors when provided.
export function BrutalistThumb({
  primary = '#E040FB',
  bg = '#0D0018',
  ink = '#FFFFFF',
}: ThumbProps) {
  const bgColor = bg;
  const inkColor = ink;
  const accentColor = primary;

  return (
    <svg
      viewBox="0 0 160 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'block', width: '100%', height: '100%' }}
      aria-hidden="true"
    >
      {/* Background */}
      <rect width="160" height="100" fill={bgColor} />
      {/* Hard top accent strip */}
      <rect width="160" height="6" fill={accentColor} />
      {/* Bold "PRESS KIT" pseudo-type — wide rectangles simulate heavy headline */}
      <rect x="12" y="16" width="72" height="8" rx="0" fill={inkColor} />
      <rect x="12" y="28" width="48" height="5" rx="0" fill={accentColor} />
      {/* Vertical rule */}
      <rect x="96" y="12" width="2" height="60" fill={accentColor} opacity="0.5" />
      {/* Right column content lines */}
      <rect x="104" y="16" width="44" height="3" rx="0" fill={inkColor} opacity="0.6" />
      <rect x="104" y="23" width="36" height="3" rx="0" fill={inkColor} opacity="0.4" />
      <rect x="104" y="30" width="40" height="3" rx="0" fill={inkColor} opacity="0.4" />
      <rect x="104" y="37" width="28" height="3" rx="0" fill={inkColor} opacity="0.3" />
      {/* Main copy lines */}
      <rect x="12" y="42" width="76" height="3" rx="0" fill={inkColor} opacity="0.4" />
      <rect x="12" y="49" width="60" height="3" rx="0" fill={inkColor} opacity="0.3" />
      <rect x="12" y="56" width="68" height="3" rx="0" fill={inkColor} opacity="0.3" />
      {/* Bottom CTA bar */}
      <rect x="0" y="82" width="160" height="18" fill={accentColor} opacity="0.15" />
      <rect x="12" y="88" width="40" height="6" rx="0" fill={accentColor} />
      <rect x="112" y="89" width="36" height="4" rx="0" fill={inkColor} opacity="0.3" />
    </svg>
  );
}
