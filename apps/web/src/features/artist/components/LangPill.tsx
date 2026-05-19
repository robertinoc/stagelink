'use client';

// LangPill — locale status pill with BASE / READY / EMPTY state badge.

type LangState = 'base' | 'ready' | 'empty';

interface LangPillProps {
  flag: string;
  name: string;
  state: LangState;
  active?: boolean;
  onClick?: () => void;
}

const STATE_STYLE: Record<LangState, { bg: string; color: string; label: string }> = {
  base: { bg: 'rgba(224,64,251,0.18)', color: '#E040FB', label: 'BASE' },
  ready: { bg: 'rgba(74,222,128,0.15)', color: '#4ADE80', label: 'READY' },
  empty: { bg: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.50)', label: 'EMPTY' },
};

export function LangPill({ flag, name, state, active, onClick }: LangPillProps) {
  const s = STATE_STYLE[state];

  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 7,
        padding: '6px 10px',
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 600,
        fontFamily: 'var(--font-body)',
        cursor: onClick ? 'pointer' : 'default',
        border: active ? '1px solid rgba(255,255,255,0.20)' : '1px solid rgba(255,255,255,0.08)',
        background: active ? 'linear-gradient(135deg,#E040FB,#9B30D0)' : 'rgba(255,255,255,0.04)',
        color: active ? 'white' : 'rgba(255,255,255,0.60)',
        boxShadow: active ? '0 0 14px rgba(224,64,251,0.25)' : 'none',
        transition: 'all 0.15s',
      }}
    >
      <span>{flag}</span>
      <span>{name}</span>
      {/* State badge */}
      <span
        style={{
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: '0.5px',
          padding: '2px 6px',
          borderRadius: 5,
          background: s.bg,
          color: s.color,
          textTransform: 'uppercase',
        }}
      >
        {s.label}
      </span>
    </button>
  );
}
