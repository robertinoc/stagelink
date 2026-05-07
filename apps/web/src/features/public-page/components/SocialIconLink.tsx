'use client';

import { useState } from 'react';
import type { ReactNode } from 'react';

interface SocialIconLinkProps {
  href: string;
  label: string;
  color: string;
  children: ReactNode;
}

export function SocialIconLink({ href, label, color, children }: SocialIconLinkProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <div className="relative flex flex-col items-center">
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={label}
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
