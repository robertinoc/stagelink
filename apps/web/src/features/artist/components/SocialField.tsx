'use client';

// SocialField — brand-tinted URL input row for the Redes y música tab.

import { Icon } from '@/components/sl/Icon';

interface SocialFieldProps {
  name: string;
  icon: string; // emoji
  brand: string; // hex color
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  helper?: string;
  disabled?: boolean;
}

export function SocialField({
  name,
  icon,
  brand,
  placeholder,
  value,
  onChange,
  helper,
  disabled,
}: SocialFieldProps) {
  const filled = value.trim().length > 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {/* Header row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 6,
        }}
      >
        {/* Brand icon square */}
        <span
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 22,
            height: 22,
            borderRadius: 6,
            background: filled ? `${brand}22` : 'rgba(255,255,255,0.04)',
            border: `1px solid ${filled ? `${brand}55` : 'rgba(255,255,255,0.08)'}`,
            fontSize: 12,
            lineHeight: 1,
            flexShrink: 0,
          }}
        >
          {icon}
        </span>
        <span
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: 13,
            fontWeight: 600,
            color: 'white',
          }}
        >
          {name}
        </span>
        <div style={{ flex: 1 }} />
        <span
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: 10,
            fontWeight: 600,
            color: filled ? '#4ADE80' : 'rgba(255,255,255,0.30)',
          }}
        >
          {filled ? '● Conectado' : 'Vacío'}
        </span>
      </div>

      {/* Input row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'stretch',
          background: 'rgba(0,0,0,0.3)',
          border: `1px solid ${filled ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.08)'}`,
          borderRadius: 10,
          overflow: 'hidden',
        }}
      >
        <input
          type="url"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          style={{
            flex: 1,
            padding: '10px 12px',
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: 'white',
            fontFamily: 'var(--font-heading)',
            fontSize: 12.5,
          }}
        />
        {filled && (
          <a
            href={value}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '0 12px',
              borderLeft: '1px solid rgba(255,255,255,0.08)',
              color: 'rgba(255,255,255,0.50)',
              flexShrink: 0,
            }}
            title={`Abrir ${name}`}
          >
            <Icon.ExternalLink size={13} />
          </a>
        )}
      </div>

      {/* Helper line */}
      {helper && (
        <span
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: 11,
            color: 'rgba(255,255,255,0.50)',
            marginTop: 5,
          }}
        >
          {helper}
        </span>
      )}
    </div>
  );
}
