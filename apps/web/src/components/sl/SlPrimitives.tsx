// SL Design System — shared primitives
// Pill, Glow, SectionHeader, Sparkline, Sparkbars

import { cn } from '@/lib/utils';

// ── Pill ────────────────────────────────────────────────────────────────────
// Small status/tone indicator badge.

type PillTone = 'neutral' | 'pink' | 'green' | 'blue' | 'yellow';

interface PillProps {
  tone?: PillTone;
  children: React.ReactNode;
  className?: string;
}

const PILL_STYLES: Record<PillTone, { bg: string; text: string; border: string }> = {
  neutral: { bg: 'bg-white/[0.06]', text: 'text-white/70', border: 'border-white/8' },
  pink: {
    bg: 'bg-[rgba(224,64,251,0.15)]',
    text: 'text-[#E040FB]',
    border: 'border-[rgba(224,64,251,0.3)]',
  },
  green: {
    bg: 'bg-[rgba(74,222,128,0.14)]',
    text: 'text-[#4ADE80]',
    border: 'border-[rgba(74,222,128,0.25)]',
  },
  blue: {
    bg: 'bg-[rgba(0,212,255,0.14)]',
    text: 'text-[#00D4FF]',
    border: 'border-[rgba(0,212,255,0.25)]',
  },
  yellow: {
    bg: 'bg-[rgba(251,191,36,0.14)]',
    text: 'text-[#FBBF24]',
    border: 'border-[rgba(251,191,36,0.25)]',
  },
};

export function Pill({ tone = 'neutral', children, className }: PillProps) {
  const s = PILL_STYLES[tone];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-[10px] py-1 text-[11px] font-bold tracking-[0.3px] whitespace-nowrap',
        s.bg,
        s.text,
        s.border,
        className,
      )}
    >
      {children}
    </span>
  );
}

// ── Glow ────────────────────────────────────────────────────────────────────
// Atmospheric radial gradient blob (decorative, pointer-events: none).

interface GlowProps {
  x?: string;
  y?: string;
  color?: string;
  size?: number;
  className?: string;
}

export function Glow({
  x = '70%',
  y = '0%',
  color = 'rgba(224,64,251,0.25)',
  size = 400,
  className,
}: GlowProps) {
  return (
    <div
      aria-hidden="true"
      className={cn('pointer-events-none absolute z-0', className)}
      style={{
        left: x,
        top: y,
        width: size,
        height: size,
        transform: 'translate(-50%, -50%)',
        background: `radial-gradient(circle, ${color} 0%, transparent 60%)`,
      }}
    />
  );
}

// ── SectionHeader ───────────────────────────────────────────────────────────
// Page-level heading with eyebrow, gradient title accent, subtitle, and right slot.

interface SectionHeaderProps {
  eyebrow?: string;
  title: string;
  /** Text appended to title, rendered with gradient fill */
  gradient?: string;
  subtitle?: string;
  right?: React.ReactNode;
  className?: string;
}

export function SectionHeader({
  eyebrow,
  title,
  gradient,
  subtitle,
  right,
  className,
}: SectionHeaderProps) {
  return (
    <header
      className={cn(
        'sl-header flex flex-wrap items-start justify-between gap-5 px-8 pb-4 pt-9',
        className,
      )}
    >
      <div className="min-w-0">
        {eyebrow && (
          <p className="mb-2.5 font-[family-name:var(--font-heading)] text-[11px] font-semibold uppercase tracking-[3px] text-[#E040FB]">
            {eyebrow}
          </p>
        )}
        <h1 className="m-0 max-w-[720px] font-[family-name:var(--font-heading)] text-[clamp(28px,4cqw,40px)] font-bold leading-[1.08] tracking-[-0.025em] text-white [text-wrap:pretty]">
          {title}
          {gradient && (
            <>
              {' '}
              <span className="text-sl-grad">{gradient}</span>
            </>
          )}
        </h1>
        {subtitle && (
          <p className="mt-3 max-w-[640px] text-[15.5px] leading-relaxed text-white/70">
            {subtitle}
          </p>
        )}
      </div>
      {right && <div className="flex shrink-0 items-center gap-2.5">{right}</div>}
    </header>
  );
}

// ── Sparkbars ───────────────────────────────────────────────────────────────
// Vertical bar chart mini visualization.

interface SparkbarsProps {
  data: number[];
  color?: string;
  height?: number;
}

export function Sparkbars({ data, color = '#E040FB', height = 36 }: SparkbarsProps) {
  const max = Math.max(...data, 1);
  return (
    <div
      style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height, width: '100%' }}
      aria-hidden="true"
    >
      {data.map((v, i) => (
        <div
          key={i}
          style={{
            flex: 1,
            height: `${Math.max(8, (v / max) * 100)}%`,
            background: color,
            opacity: 0.4 + (v / max) * 0.6,
            borderRadius: 2,
          }}
        />
      ))}
    </div>
  );
}

// ── Sparkline ───────────────────────────────────────────────────────────────
// SVG line chart mini visualization with optional area fill.

interface SparklineProps {
  data: number[];
  color?: string;
  height?: number;
  width?: number;
  fill?: boolean;
}

export function Sparkline({
  data,
  color = '#E040FB',
  height = 40,
  width = 200,
  fill = true,
}: SparklineProps) {
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return `${x},${y}`;
  });
  const gradId = `spark-${color.replace('#', '')}`;
  return (
    <svg
      width="100%"
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      style={{ display: 'block' }}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.5" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {fill && (
        <polygon
          points={`0,${height} ${pts.join(' ')} ${width},${height}`}
          fill={`url(#${gradId})`}
        />
      )}
      <polyline
        points={pts.join(' ')}
        fill="none"
        stroke={color}
        strokeWidth="1.8"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}
