'use client';

// EpkSaveBar — floating save pill anchored bottom-center.
// Appears only when there are unsaved changes (controlled by parent's isDirty).
// Renders nothing when EPK is locked (published) or when there are no changes.

interface EpkSaveBarProps {
  /** Pure 'idle' | 'saving' | 'success' | 'error' from parent */
  status: 'idle' | 'saving' | 'success' | 'error';
  /** Error message when status === 'error' */
  errorMessage: string | null;
  /** Whether the form is dirty (unsaved changes exist) */
  isDirty: boolean;
  /** Whether the EPK is published (locked, can't save) */
  locked: boolean;
  /** Whether all required fields are filled */
  ready: boolean;
  /** Missing fields when not ready */
  missing: string[];
  /** Submit handler (calls form.handleSubmit internally in parent) */
  onSave: () => void;
}

export function EpkSaveBar({
  status,
  errorMessage,
  isDirty,
  locked,
  ready,
  missing,
  onSave,
}: EpkSaveBarProps) {
  // Hide when locked (can't save anyway) or no changes & idle
  if (locked) return null;
  if (!isDirty && status === 'idle') return null;

  // Determine state visual
  const isSaving = status === 'saving';
  const isSuccess = status === 'success';
  const isError = status === 'error';
  const canSave = ready && !isSaving;

  let dotColor = '#E040FB';
  let label = 'Draft sin guardar';
  if (isSaving) {
    dotColor = '#FBBF24';
    label = 'Guardando…';
  } else if (isSuccess) {
    dotColor = '#4ADE80';
    label = 'Guardado';
  } else if (isError) {
    dotColor = '#ff6b6b';
    label = errorMessage ?? 'Error al guardar';
  } else if (!ready) {
    dotColor = '#FBBF24';
    label = `Faltan: ${missing.join(', ')}`;
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 20,
        left: '50%',
        transform: 'translateX(-50%)',
        padding: '10px 12px 10px 20px',
        borderRadius: 999,
        background: 'rgba(13,10,26,0.96)',
        border: '1px solid rgba(224,64,251,0.35)',
        boxShadow: '0 12px 40px rgba(0,0,0,0.5), 0 0 28px rgba(224,64,251,0.25)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        zIndex: 200,
        fontFamily: 'var(--font-body)',
        maxWidth: 'calc(100vw - 40px)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: dotColor,
            boxShadow: `0 0 8px ${dotColor}`,
            flexShrink: 0,
          }}
        />
        <span
          style={{
            fontSize: 13,
            color: isError ? '#ff6b6b' : 'white',
            fontWeight: 500,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            maxWidth: 320,
          }}
        >
          {label}
        </span>
      </div>
      <button
        type="button"
        onClick={onSave}
        disabled={!canSave}
        style={{
          padding: '8px 18px',
          borderRadius: 999,
          background: canSave
            ? 'linear-gradient(135deg,#E040FB 0%,#9B30D0 45%,#4A1A8C 100%)'
            : 'rgba(255,255,255,0.06)',
          color: canSave ? 'white' : 'rgba(255,255,255,0.4)',
          border: 'none',
          fontSize: 13,
          fontWeight: 600,
          fontFamily: 'var(--font-body)',
          cursor: canSave ? 'pointer' : 'not-allowed',
          boxShadow: canSave ? '0 0 20px rgba(224,64,251,0.4)' : 'none',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          whiteSpace: 'nowrap',
        }}
      >
        {isSaving ? '⟳ Guardando…' : isSuccess ? '✓ Guardado' : '✓ Guardar draft'}
      </button>
    </div>
  );
}
