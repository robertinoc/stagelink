'use client';

// EpkBookingSection — inline collapsible row used inside Booking tab.
// Replaces the modal-based RiderEditDialog. Three of these stack inside one
// Bento card (Availability / Artist requirements / Technical rider).
//
// Collapsed: icon square | title + 1-line preview | [Editar / Cerrar] button
// Expanded (editable): same header + textarea below with char count
// Expanded (locked):   same header + read-only preview below

import { useState } from 'react';
import { useTranslations } from 'next-intl';

interface EpkBookingSectionProps {
  icon: string;
  title: string;
  /** Helpful one-liner shown beside the textarea, e.g. "Touring windows, transfers..." */
  description: string;
  /** Placeholder shown when value is empty */
  placeholder: string;
  /** Current value */
  value: string;
  /** Read-only / draft-mode flag */
  locked: boolean;
  /** First or last child controls border rendering */
  last?: boolean;
  /** Save handler (called on textarea blur or explicit save) */
  onChange: (next: string) => void;
}

const MAX_LENGTH = 5000;

export function EpkBookingSection({
  icon,
  title,
  description,
  placeholder,
  value,
  locked,
  last,
  onChange,
}: EpkBookingSectionProps) {
  const t = useTranslations('dashboard.epk.editor');
  const [expanded, setExpanded] = useState(false);
  const trimmed = value.trim();
  const preview = trimmed ? trimmed.slice(0, 110) + (trimmed.length > 110 ? '…' : '') : null;

  return (
    <div
      style={{
        padding: '14px 24px',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        borderBottom: last ? '1px solid rgba(255,255,255,0.06)' : 'none',
      }}
    >
      {/* Row header */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'auto 1fr auto',
          gap: 14,
          alignItems: 'center',
        }}
      >
        <span
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            background: 'rgba(255,255,255,0.05)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 20,
            flexShrink: 0,
          }}
        >
          {icon}
        </span>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 14, color: 'white', fontWeight: 600 }}>{title}</div>
          {preview ? (
            <div
              style={{
                fontSize: 12,
                color: 'rgba(255,255,255,0.5)',
                marginTop: 3,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {preview}
            </div>
          ) : (
            <div
              style={{
                fontSize: 12,
                color: 'rgba(255,255,255,0.3)',
                marginTop: 3,
                fontStyle: 'italic',
              }}
            >
              {t('bookingSection.emptyContent')}
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          style={{
            padding: '7px 12px',
            borderRadius: 8,
            background: 'transparent',
            color: 'rgba(255,255,255,0.7)',
            border: '1px solid rgba(255,255,255,0.12)',
            fontFamily: 'var(--font-body)',
            fontSize: 11.5,
            fontWeight: 600,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          {expanded
            ? t('bookingSection.close')
            : locked
              ? t('bookingSection.view')
              : t('bookingSection.edit')}
        </button>
      </div>

      {/* Expanded body */}
      {expanded && (
        <div style={{ marginTop: 12 }}>
          {description && (
            <p
              style={{
                fontSize: 12,
                color: 'rgba(255,255,255,0.5)',
                marginBottom: 8,
                lineHeight: 1.5,
              }}
            >
              {description}
            </p>
          )}
          <textarea
            rows={locked ? 8 : 12}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            readOnly={locked}
            maxLength={MAX_LENGTH}
            style={{
              width: '100%',
              padding: '12px 14px',
              borderRadius: 10,
              background: 'rgba(0,0,0,0.25)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: 'rgba(255,255,255,0.85)',
              fontFamily: 'monospace',
              fontSize: 12.5,
              lineHeight: 1.65,
              resize: 'vertical',
              outline: 'none',
              boxSizing: 'border-box',
              cursor: locked ? 'default' : 'text',
              whiteSpace: 'pre-wrap',
            }}
          />
          {!locked && (
            <div
              style={{
                textAlign: 'right',
                fontSize: 11,
                marginTop: 4,
                color: value.length > MAX_LENGTH * 0.95 ? '#FBBF24' : 'rgba(255,255,255,0.35)',
              }}
            >
              {value.length.toLocaleString()} / {MAX_LENGTH.toLocaleString()}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
