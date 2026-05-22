'use client';

// EpkLockedBanner — green notice shown at top of each tab when EPK is published.
// Tells the user to unpublish to enable editing. Matches design handoff prototype.

import { useTranslations } from 'next-intl';

export function EpkLockedBanner() {
  const t = useTranslations('dashboard.epk.editor');
  return (
    <div
      style={{
        padding: '12px 16px',
        borderRadius: 10,
        background: 'rgba(74,222,128,0.08)',
        border: '1px solid rgba(74,222,128,0.22)',
        fontSize: 12.5,
        color: 'rgba(255,255,255,0.7)',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
      }}
    >
      <span style={{ color: '#4ADE80', fontSize: 14 }}>🔒</span>
      <span>
        {t.rich('locked.notice', {
          strong: (chunks) => <strong style={{ color: 'white' }}>{chunks}</strong>,
        })}
      </span>
    </div>
  );
}
