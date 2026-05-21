'use client';

import { useState } from 'react';
import type { ReactNode } from 'react';
import { trackPublicLinkClick } from '@/lib/analytics/track';

interface SocialIconLinkProps {
  href: string;
  label: string;
  color: string;
  children: ReactNode;
  /** Stable platform key (e.g. "instagram", "tiktok") — used as link_item_id suffix. */
  platformKey: string;
  /** Page metadata for analytics tracking. */
  artistId: string;
  username: string;
  pageId: string;
}

/**
 * SocialIconLink — renders a single social-media icon link with hover glow.
 *
 * Click tracking:
 *   On click, fires trackPublicLinkClick with block_type='social'. Each platform
 *   uses a deterministic linkItemId (`social-${platformKey}`) so per-platform
 *   click counts aggregate cleanly in the analytics topLinks query.
 *   Tracking is fire-and-forget and never blocks navigation.
 */
export function SocialIconLink({
  href,
  label,
  color,
  children,
  platformKey,
  artistId,
  username,
  pageId,
}: SocialIconLinkProps) {
  const [hovered, setHovered] = useState(false);

  function handleClick() {
    trackPublicLinkClick({
      artist_id: artistId,
      username,
      environment: process.env.NEXT_PUBLIC_APP_ENV ?? process.env.NODE_ENV ?? 'development',
      page_id: pageId,
      block_type: 'social',
      // Synthetic link_item_id — must match LINK_ITEM_ID_PATTERN ^[\w-]+$
      link_item_id: `social-${platformKey}`,
      label,
      destination_url: href,
    });
  }

  return (
    <div className="relative flex flex-col items-center">
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={label}
        onClick={handleClick}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={
          hovered
            ? {
                boxShadow: `0 0 16px ${color}99, 0 0 32px ${color}55, 0 0 6px ${color}cc inset`,
                borderColor: `${color}90`,
                color,
                backgroundColor: `${color}1a`,
              }
            : undefined
        }
        className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-zinc-200 transition-all duration-300"
      >
        {children}
      </a>

      <span
        aria-hidden="true"
        style={hovered ? { color } : undefined}
        className={`pointer-events-none absolute -bottom-7 whitespace-nowrap rounded-md border border-white/10 bg-black/80 px-2 py-0.5 text-[11px] font-semibold tracking-wide text-white/80 backdrop-blur-sm transition-all duration-200 ${
          hovered ? 'translate-y-0 opacity-100' : 'translate-y-1 opacity-0'
        }`}
      >
        {label}
      </span>
    </div>
  );
}
