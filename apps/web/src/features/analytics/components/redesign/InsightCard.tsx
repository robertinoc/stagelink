'use client';

import { cn } from '@/lib/utils';

type InsightTone = 'yellow' | 'cyan';

interface InsightCardProps {
  tone: InsightTone;
  icon: string;
  eyebrow: string;
  sourcePill?: string;
  title: string;
  sub?: string;
  cta?: { label: string; href: string };
  className?: string;
}

const STYLES: Record<InsightTone, { bg: string; border: string; accent: string }> = {
  yellow: {
    bg: 'bg-[linear-gradient(160deg,rgba(251,191,36,0.10)_0%,rgba(255,255,255,0.02)_100%)]',
    border: 'border-[rgba(251,191,36,0.33)]',
    accent: '#FBBF24',
  },
  cyan: {
    bg: 'bg-[linear-gradient(160deg,rgba(0,212,255,0.10)_0%,rgba(255,255,255,0.02)_100%)]',
    border: 'border-[rgba(0,212,255,0.33)]',
    accent: '#00D4FF',
  },
};

export function InsightCard({
  tone,
  icon,
  eyebrow,
  sourcePill,
  title,
  sub,
  cta,
  className,
}: InsightCardProps) {
  const s = STYLES[tone];
  return (
    <div className={cn('rounded-xl border p-4', s.bg, s.border, className)}>
      <div className="flex items-center gap-2.5">
        <span
          aria-hidden="true"
          className="inline-flex h-7 w-7 items-center justify-center rounded-md text-base"
          style={{ background: `${s.accent}1A`, border: `1px solid ${s.accent}44` }}
        >
          {icon}
        </span>
        <span className="flex-1 text-[11.5px] font-semibold text-white">{eyebrow}</span>
        {sourcePill && (
          <span className="rounded-md border border-white/10 bg-white/[0.05] px-2 py-[3px] font-[family-name:var(--font-heading)] text-[10px] font-bold uppercase tracking-[0.5px] text-white/70">
            {sourcePill}
          </span>
        )}
      </div>
      <div className="mt-3 text-[13.5px] font-medium leading-snug text-white">{title}</div>
      {sub && <div className="mt-1 text-[12px] text-white/50">{sub}</div>}
      {cta && (
        <a
          href={cta.href}
          className="mt-3 inline-flex items-center text-[12px] font-semibold transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E040FB] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0D0A1A]"
          style={{ color: s.accent }}
        >
          {cta.label}
        </a>
      )}
    </div>
  );
}
