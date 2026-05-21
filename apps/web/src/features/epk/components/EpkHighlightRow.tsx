'use client';

// EpkHighlightRow — career highlight row with ★ icon square (gradient bg)
// + inline edit input + delete button. Stacks inside the Booking tab's
// Career highlights Bento card.

import { useState, useRef, useEffect } from 'react';

interface EpkHighlightRowProps {
  value: string;
  locked: boolean;
  last?: boolean;
  /** Save handler; called on blur or Enter */
  onChange: (next: string) => void;
  onRemove: () => void;
}

export function EpkHighlightRow({ value, locked, last, onChange, onRemove }: EpkHighlightRowProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  function commit() {
    onChange(draft.trim());
    setEditing(false);
  }

  function cancel() {
    setDraft(value);
    setEditing(false);
  }

  // When parent value changes (e.g. after remove of another row), sync draft
  useEffect(() => {
    if (!editing) setDraft(value);
  }, [value, editing]);

  const displayValue = value.trim() || 'Highlight sin texto';

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'auto 1fr auto',
        gap: 14,
        alignItems: 'center',
        padding: '14px 24px',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        borderBottom: last ? '1px solid rgba(255,255,255,0.06)' : 'none',
      }}
    >
      {/* ★ icon square */}
      <span
        style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          background: 'linear-gradient(135deg,#E040FB 0%,#9B30D0 45%,#4A1A8C 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 16,
          color: 'white',
          boxShadow: '0 0 12px rgba(224,64,251,0.3)',
          flexShrink: 0,
        }}
      >
        ★
      </span>

      {/* Text / input */}
      <div style={{ minWidth: 0 }}>
        {editing && !locked ? (
          <input
            ref={inputRef}
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                commit();
              }
              if (e.key === 'Escape') {
                e.preventDefault();
                cancel();
              }
            }}
            maxLength={160}
            placeholder="Headline @ Salon Recoleta 2024 · 800 personas · noviembre 2024"
            style={{
              width: '100%',
              padding: '6px 10px',
              borderRadius: 8,
              background: 'rgba(0,0,0,0.3)',
              border: '1px solid rgba(224,64,251,0.4)',
              color: 'white',
              fontSize: 13.5,
              fontWeight: 600,
              fontFamily: 'var(--font-body)',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        ) : (
          <div
            style={{
              fontSize: 13.5,
              color: value.trim() ? 'white' : 'rgba(255,255,255,0.3)',
              fontWeight: 600,
              fontStyle: value.trim() ? 'normal' : 'italic',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {displayValue}
          </div>
        )}
      </div>

      {/* Actions */}
      {!locked && !editing && (
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            type="button"
            onClick={() => setEditing(true)}
            title="Editar"
            style={iconBtnStyle}
          >
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
          <button
            type="button"
            onClick={onRemove}
            title="Borrar"
            style={{ ...iconBtnStyle, color: '#ff6b6b' }}
          >
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}

const iconBtnStyle: React.CSSProperties = {
  width: 30,
  height: 30,
  borderRadius: 8,
  background: 'transparent',
  border: '1px solid rgba(255,255,255,0.1)',
  color: 'rgba(255,255,255,0.6)',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};
