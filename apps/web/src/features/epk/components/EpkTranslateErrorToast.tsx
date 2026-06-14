'use client';

// EpkTranslateErrorToast — fixed top-center toast shown when client-side
// auto-translation fails on a public EPK. Kept theme-agnostic (its own dark
// red surface) so it reads clearly over any of the 3 EPK templates.

interface EpkTranslateErrorToastProps {
  message: string;
  dismissLabel: string;
  onDismiss: () => void;
}

export function EpkTranslateErrorToast({
  message,
  dismissLabel,
  onDismiss,
}: EpkTranslateErrorToastProps) {
  return (
    <div
      role="alert"
      style={{
        position: 'fixed',
        top: 16,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 200,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        maxWidth: 'calc(100vw - 32px)',
        padding: '10px 14px',
        borderRadius: 10,
        background: 'rgba(127,29,29,0.96)',
        border: '1px solid rgba(248,113,113,0.5)',
        color: '#fee2e2',
        fontSize: 13,
        fontWeight: 500,
        boxShadow: '0 8px 30px rgba(0,0,0,0.35)',
      }}
    >
      <span>{message}</span>
      <button
        type="button"
        onClick={onDismiss}
        style={{
          background: 'rgba(255,255,255,0.1)',
          border: '1px solid rgba(255,255,255,0.2)',
          borderRadius: 6,
          padding: '3px 8px',
          fontSize: 12,
          fontWeight: 600,
          color: '#fff',
          cursor: 'pointer',
          flexShrink: 0,
        }}
      >
        {dismissLabel}
      </button>
    </div>
  );
}
