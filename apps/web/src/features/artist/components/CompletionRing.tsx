'use client';

// CompletionRing — animated SVG circular progress ring with gradient stroke.
// Shown in the SectionHeader right slot alongside "Ver mi página".

import { BentoLabel } from '@/components/sl/Bento';

interface CompletionRingProps {
  pct: number; // 0–100
}

function ringLabel(pct: number) {
  if (pct >= 90) return 'Perfil listo';
  if (pct >= 60) return 'Casi listo';
  return 'En progreso';
}

export function CompletionRing({ pct }: CompletionRingProps) {
  const r = 18;
  const circumference = 2 * Math.PI * r;
  const filled = circumference * (pct / 100);
  const gradId = 'cr-grad';

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 10,
        padding: '8px 14px 8px 8px',
        borderRadius: 999,
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      {/* SVG ring */}
      <svg
        width={44}
        height={44}
        viewBox="0 0 44 44"
        style={{ transform: 'rotate(-90deg)' }}
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#E040FB" />
            <stop offset="100%" stopColor="#4A1A8C" />
          </linearGradient>
        </defs>
        {/* Track */}
        <circle cx={22} cy={22} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={4} />
        {/* Progress */}
        <circle
          cx={22}
          cy={22}
          r={r}
          fill="none"
          stroke={`url(#${gradId})`}
          strokeWidth={4}
          strokeLinecap="round"
          strokeDasharray={`${filled} ${circumference}`}
          style={{ transition: 'stroke-dasharray 0.6s ease' }}
        />
        {/* Center text — counter-rotate so it reads upright */}
        <text
          x={22}
          y={22}
          dominantBaseline="central"
          textAnchor="middle"
          fontSize={11}
          fontWeight={700}
          fill="white"
          fontFamily="var(--font-heading)"
          style={{ transform: 'rotate(90deg)', transformOrigin: '22px 22px' }}
        >
          {pct}%
        </text>
      </svg>

      {/* Label block */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <BentoLabel>COMPLETITUD</BentoLabel>
        <span
          style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 11,
            fontWeight: 600,
            color: 'rgba(255,255,255,0.72)',
          }}
        >
          {ringLabel(pct)}
        </span>
      </div>
    </div>
  );
}
