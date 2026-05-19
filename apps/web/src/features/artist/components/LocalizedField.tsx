'use client';

// LocalizedField — a labeled input/textarea row for translated content.
// Used in the SEO & idiomas tab localized content block.

interface LocalizedFieldProps {
  label: string;
  locale: string; // e.g. "ES"
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
  rows?: number;
  maxLength?: number;
  disabled?: boolean;
}

export function LocalizedField({
  label,
  locale,
  value,
  onChange,
  multiline,
  rows = 3,
  maxLength,
  disabled,
}: LocalizedFieldProps) {
  const len = value.length;

  const sharedStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 14px',
    background: 'rgba(0,0,0,0.25)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 8,
    outline: 'none',
    color: 'white',
    fontFamily: 'var(--font-body)',
    fontSize: 13.5,
    lineHeight: 1.6,
    resize: multiline ? 'vertical' : 'none',
    transition: 'border-color 0.15s',
  };

  return (
    <div style={{ padding: '16px 0' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          marginBottom: 8,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 13,
              fontWeight: 500,
              color: 'white',
            }}
          >
            {label}
          </span>
          <span
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.5px',
              padding: '2px 7px',
              borderRadius: 5,
              background: 'rgba(224,64,251,0.12)',
              color: '#E040FB',
              textTransform: 'uppercase',
            }}
          >
            {locale}
          </span>
        </div>
        {maxLength && (
          <span
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 11,
              color: 'rgba(255,255,255,0.50)',
            }}
          >
            {len}/{maxLength}
          </span>
        )}
      </div>

      {/* Input / Textarea */}
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          rows={rows}
          style={sharedStyle}
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          style={sharedStyle}
        />
      )}
    </div>
  );
}
