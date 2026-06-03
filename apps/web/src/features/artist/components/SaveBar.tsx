'use client';

// SaveBar — fixed bottom-center pill that shows autosave state.
// Green "Todo guardado" when clean; pink pulsing "Cambios sin guardar" when dirty.

import { Icon } from '@/components/sl/Icon';
import { Btn } from '@/components/sl/Btn';

interface SaveBarProps {
  isDirty: boolean;
  isSaving?: boolean;
  saveError?: boolean;
  onSave: () => void;
  onDiscard: () => void;
}

export function SaveBar({ isDirty, isSaving, onSave, onDiscard }: SaveBarProps) {
  if (!isDirty && !isSaving) {
    return (
      <div
        style={{
          position: 'fixed',
          bottom: 24,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 50,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '8px 16px',
          borderRadius: 999,
          background: 'rgba(74,222,128,0.10)',
          border: '1px solid rgba(74,222,128,0.25)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          color: '#4ADE80',
          fontFamily: 'var(--font-body)',
          fontSize: 13,
          fontWeight: 500,
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
        }}
      >
        <span
          style={{
            display: 'inline-block',
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: '#4ADE80',
            boxShadow: '0 0 6px #4ADE80',
          }}
        />
        Todo guardado · auto-save activo
      </div>
    );
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 20,
        left: '50%',
        transform: 'translateX(-50%)',
        // maxWidth ensures the pill never overflows the viewport on narrow
        // mobile screens. Without this, the pill can exceed 390px on small
        // phones, pushing the "Guardar cambios" button partially off-screen
        // where iOS Safari drops touch events entirely.
        maxWidth: 'calc(100vw - 32px)',
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '10px 12px 10px 20px',
        borderRadius: 999,
        background: 'rgba(13,10,26,0.96)',
        border: '1px solid rgba(224,64,251,0.35)',
        boxShadow: '0 12px 40px rgba(0,0,0,0.5), 0 0 28px rgba(224,64,251,0.25)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}
    >
      {/* Pulsing dot */}
      <span
        className="animate-pulse"
        style={{
          display: 'inline-block',
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: '#E040FB',
          flexShrink: 0,
        }}
      />

      {/* Label — hidden on very narrow viewports so the buttons always fit */}
      <span
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: 13,
          fontWeight: 500,
          color: 'white',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          minWidth: 0,
        }}
        className="hidden xs:inline sm:inline"
      >
        Cambios sin guardar
      </span>

      <Btn
        variant="bare"
        size="sm"
        type="button"
        onClick={onDiscard}
        disabled={isSaving}
        className="shrink-0 text-white/50 hover:text-white/80"
      >
        Descartar
      </Btn>

      <Btn
        variant="primary"
        size="sm"
        type="button"
        icon={<Icon.Check size={14} />}
        onClick={onSave}
        disabled={isSaving}
        className="shrink-0"
      >
        {isSaving ? 'Guardando…' : 'Guardar'}
      </Btn>
    </div>
  );
}
