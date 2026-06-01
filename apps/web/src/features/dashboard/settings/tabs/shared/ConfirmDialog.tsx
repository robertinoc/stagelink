'use client';

import { RED_BUTTON_CLASS } from '../plan/PlanDangerZone';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  body: string;
  confirmLabel: string;
  cancelLabel: string;
  /** When set, the confirm button shows this label and stays disabled (in-flight). */
  pendingLabel?: string;
  pending?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Small SL-styled confirmation modal. Used for destructive store
 * disconnects (Shopify / Printful) so the action isn't a one-click
 * accident, and to surface a "Disconnecting…" in-flight state.
 */
export function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel,
  cancelLabel,
  pendingLabel,
  pending = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
    >
      <div className="w-full max-w-[420px] rounded-[16px] border border-white/10 bg-[#0D0A1A] p-6 shadow-[0_0_60px_rgba(0,0,0,0.5)]">
        <h2 className="m-0 font-[family-name:var(--font-heading)] text-[18px] font-bold text-white">
          {title}
        </h2>
        <p className="mt-3 text-[13.5px] leading-[1.55] text-white/70">{body}</p>
        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={pending}
            className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-transparent px-4 py-2.5 text-[13px] font-semibold text-white/70 transition-colors hover:bg-white/[0.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#0D0A1A] disabled:opacity-40"
          >
            {cancelLabel}
          </button>
          <button type="button" onClick={onConfirm} disabled={pending} className={RED_BUTTON_CLASS}>
            {pending && pendingLabel ? pendingLabel : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
