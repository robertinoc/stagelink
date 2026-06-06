'use client';

// EpkShimmerLinks — shared link pill row with shimmer animation.
// Used by all 3 EPK templates (Studio, Cinematic, Brutalist) in the
// non-print, screen-facing render of featuredLinks.
//
// The shimmer is a semi-transparent highlight that sweeps across each pill.
// Delays are staggered so pills don't pulse in sync.
// Animation pauses on hover.

import type { EpkFeaturedLinkItem } from '@stagelink/types';

interface EpkShimmerLinksProps {
  links: EpkFeaturedLinkItem[];
  /** Base pill styles — background, border, color vary per template */
  pillStyle: React.CSSProperties;
  /** Wrapper gap */
  gap?: number;
}

const SHIMMER_DELAY_MS = 350; // stagger between pills

export function EpkShimmerLinks({ links, pillStyle, gap = 8 }: EpkShimmerLinksProps) {
  return (
    <>
      <style>{`
        @keyframes epk-shimmer {
          0%   { transform: translateX(-120%); }
          100% { transform: translateX(220%); }
        }
        .epk-pill-shimmer:hover .epk-shimmer-sweep {
          animation-play-state: paused;
        }
      `}</style>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap }}>
        {links.map((lnk, index) => (
          <a
            key={lnk.id}
            href={lnk.url}
            target="_blank"
            rel="noreferrer"
            className="epk-pill-shimmer"
            style={{
              position: 'relative',
              overflow: 'hidden',
              textDecoration: 'none',
              ...pillStyle,
            }}
          >
            {/* shimmer sweep */}
            <span
              className="epk-shimmer-sweep"
              aria-hidden="true"
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '45%',
                height: '100%',
                background:
                  'linear-gradient(105deg, transparent 0%, rgba(255,255,255,0.04) 40%, rgba(255,255,255,0.14) 50%, rgba(255,255,255,0.04) 60%, transparent 100%)',
                animation: `epk-shimmer 2.8s ease-in-out infinite`,
                animationDelay: `${index * SHIMMER_DELAY_MS}ms`,
                pointerEvents: 'none',
              }}
            />
            {lnk.label}
          </a>
        ))}
      </div>
    </>
  );
}
