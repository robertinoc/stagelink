import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface HelpBannerProps {
  title: string;
  body: ReactNode;
  emoji: string;
  /** Accent colour. Defaults to cyan (Conexiones); pass green for Tiendas. */
  tone?: 'cyan' | 'green';
}

const TONE_STYLES = {
  cyan: {
    bg: 'bg-[linear-gradient(160deg,rgba(0,212,255,0.08)_0%,rgba(255,255,255,0.02)_100%)]',
    border: 'border-[rgba(0,212,255,0.2)]',
    iconBg: 'bg-[rgba(0,212,255,0.15)] text-[#00D4FF]',
  },
  green: {
    bg: 'bg-[linear-gradient(160deg,rgba(74,222,128,0.06)_0%,rgba(255,255,255,0.02)_100%)]',
    border: 'border-[rgba(74,222,128,0.18)]',
    iconBg: 'bg-[rgba(74,222,128,0.15)] text-[#4ADE80]',
  },
} as const;

/**
 * Top-of-tab help banner used by Conexiones (cyan) and Tiendas (green).
 * Pure presentation — caller passes title, body (can include bold) and
 * the emoji to render in the leading icon tile.
 */
export function HelpBanner({ title, body, emoji, tone = 'cyan' }: HelpBannerProps) {
  const s = TONE_STYLES[tone];
  return (
    <div
      className={cn(
        'flex items-start gap-4 rounded-[14px] border px-[18px] py-[14px]',
        s.bg,
        s.border,
      )}
    >
      <div
        aria-hidden="true"
        className={cn(
          'inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] text-base',
          s.iconBg,
        )}
      >
        {emoji}
      </div>
      <div className="min-w-0">
        <p className="text-[13.5px] font-semibold text-white">{title}</p>
        <p className="mt-1 text-[12.5px] leading-[1.5] text-white/70">{body}</p>
      </div>
    </div>
  );
}
