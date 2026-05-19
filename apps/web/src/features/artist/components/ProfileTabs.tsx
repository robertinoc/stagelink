'use client';

// ProfileTabs — sticky horizontal tab bar with per-tab completion status dots.

import { cn } from '@/lib/utils';
import type { TabCompletion } from '../utils/profileCompletion';

export type ProfileTabId = 'identity' | 'social' | 'catalog' | 'seo';

const TABS: { id: ProfileTabId; label: string; hint: string }[] = [
  { id: 'identity', label: 'Identidad y galería', hint: 'Foto, bio, géneros' },
  { id: 'social', label: 'Redes y música', hint: '14 plataformas' },
  { id: 'catalog', label: 'Catálogo', hint: 'Sellos + releases' },
  { id: 'seo', label: 'SEO & idiomas', hint: 'URL, meta, traducción' },
];

function dotColor(pct: number) {
  if (pct >= 80) return '#4ADE80';
  if (pct >= 40) return '#FBBF24';
  return '#ff6b6b';
}

interface ProfileTabsProps {
  value: ProfileTabId;
  onChange: (tab: ProfileTabId) => void;
  completion: TabCompletion;
}

export function ProfileTabs({ value, onChange, completion }: ProfileTabsProps) {
  return (
    <nav
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 5,
        background: 'rgba(13,10,26,0.85)',
        backdropFilter: 'blur(20px) saturate(160%)',
        WebkitBackdropFilter: 'blur(20px) saturate(160%)',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        padding: '0 32px',
        overflowX: 'auto',
        scrollbarWidth: 'none',
      }}
      className="[&::-webkit-scrollbar]:hidden"
    >
      <div style={{ display: 'flex', minWidth: 'max-content' }}>
        {TABS.map((tab) => {
          const pct = completion[tab.id];
          const color = dotColor(pct);
          const isActive = value === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              style={{
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                gap: 3,
                padding: '14px 18px 16px',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: isActive ? 'white' : 'rgba(255,255,255,0.55)',
                transition: 'color 0.15s ease',
              }}
            >
              {/* Status dot */}
              <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <span
                  style={{
                    display: 'inline-block',
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: color,
                    boxShadow: `0 0 8px ${color}88`,
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: 14,
                    fontWeight: isActive ? 700 : 600,
                    lineHeight: 1,
                  }}
                >
                  {tab.label}
                </span>
              </span>

              {/* Hint + percentage */}
              <span
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: 11,
                  color: 'rgba(255,255,255,0.40)',
                  paddingLeft: 15,
                }}
              >
                {tab.hint}
                {' · '}
                <span style={{ color, fontWeight: 600 }}>{pct}%</span>
              </span>

              {/* Active underline */}
              {isActive && (
                <span
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 12,
                    right: 12,
                    height: 2,
                    borderRadius: 2,
                    background: 'linear-gradient(135deg,#E040FB,#9B30D0)',
                    boxShadow: '0 0 8px rgba(224,64,251,0.6)',
                  }}
                />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
