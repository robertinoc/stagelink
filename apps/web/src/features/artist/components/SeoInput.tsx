'use client';

// SeoInput — text input or textarea with live char counter and sweet-spot coloring.

interface SeoInputProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  max: number;
  recommended?: string; // e.g. "50–60 caracteres"
  multiline?: boolean;
  rows?: number;
  disabled?: boolean;
  placeholder?: string;
}

export function SeoInput({
  label,
  value,
  onChange,
  max,
  recommended,
  multiline,
  rows = 3,
  disabled,
  placeholder,
}: SeoInputProps) {
  const len = value.length;
  const over = len > max;

  // Infer sweet-spot from recommended string (e.g. "50–60")
  let inRange = false;
  if (recommended) {
    const m = recommended.match(/(\d+)[–-](\d+)/);
    if (m) {
      const lo = parseInt(m[1] ?? '0', 10);
      const hi = parseInt(m[2] ?? '0', 10);
      inRange = len >= lo && len <= hi;
    }
  }

  const counterColor = over ? '#ff6b6b' : inRange ? '#4ADE80' : 'rgba(255,255,255,0.50)';
  const borderColor = over ? 'rgba(255,107,107,0.4)' : 'rgba(255,255,255,0.08)';

  const sharedInputStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px 16px',
    background: 'rgba(0,0,0,0.3)',
    border: `1px solid ${borderColor}`,
    borderRadius: 10,
    outline: 'none',
    color: 'white',
    fontFamily: 'var(--font-heading)',
    fontSize: 13,
    transition: 'border-color 0.15s',
    resize: multiline ? 'vertical' : 'none',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {/* Label */}
      <div
        style={{
          fontFamily: 'var(--font-heading)',
          fontSize: 12,
          fontWeight: 600,
          color: 'rgba(255,255,255,0.60)',
          marginBottom: 6,
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
        }}
      >
        {label}
      </div>

      {/* Input / Textarea */}
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          rows={rows}
          placeholder={placeholder}
          style={sharedInputStyle}
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          placeholder={placeholder}
          style={sharedInputStyle}
        />
      )}

      {/* Counter row */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: 5,
          fontFamily: 'var(--font-body)',
          fontSize: 11,
        }}
      >
        {recommended && (
          <span style={{ color: 'rgba(255,255,255,0.40)' }}>Recomendado: {recommended}</span>
        )}
        <span
          style={{
            marginLeft: 'auto',
            color: counterColor,
            fontWeight: inRange || over ? 600 : 400,
          }}
        >
          {inRange && '✓ '}
          {len}/{max}
          {over && ' · demasiado largo'}
        </span>
      </div>
    </div>
  );
}
