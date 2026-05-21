'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { RED_BUTTON_CLASS } from '../plan/PlanDangerZone';
import { deleteAccount } from '@/lib/api/privacy';
import { cn } from '@/lib/utils';

interface DeleteAccountDialogProps {
  open: boolean;
  onClose: () => void;
  email: string;
}

/**
 * 2-step destructive confirmation. Step 1 forces the user to acknowledge
 * the irreversibility; step 2 requires retyping the authenticated email.
 * Matches the existing `deleteAccount(confirmEmail)` API contract — the
 * spec mentions "handle", but the backend accepts email.
 */
export function DeleteAccountDialog({ open, onClose, email }: DeleteAccountDialogProps) {
  const t = useTranslations('dashboard.settings.danger.delete_dialog');
  const [step, setStep] = useState<1 | 2>(1);
  const [acknowledged, setAcknowledged] = useState(false);
  const [confirmation, setConfirmation] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const reset = () => {
    setStep(1);
    setAcknowledged(false);
    setConfirmation('');
    setError(null);
    setPending(false);
  };

  const onCancel = () => {
    reset();
    onClose();
  };

  const onConfirm = async () => {
    if (confirmation.trim().toLowerCase() !== email.toLowerCase()) {
      setError(t('error_email_mismatch'));
      return;
    }
    setPending(true);
    setError(null);
    try {
      await deleteAccount(confirmation.trim());
      window.location.href = '/api/auth/signout';
    } catch (e) {
      setError(e instanceof Error ? e.message : t('error_generic'));
      setPending(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-account-title"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
    >
      <div className="w-full max-w-[480px] rounded-[16px] border border-[rgba(255,107,107,0.3)] bg-[#0D0A1A] p-6 shadow-[0_0_60px_rgba(255,107,107,0.25)]">
        <h2
          id="delete-account-title"
          className="m-0 font-[family-name:var(--font-heading)] text-[20px] font-bold text-white"
        >
          {t('title')}
        </h2>
        {step === 1 ? (
          <div className="mt-4 space-y-4">
            <p className="text-[13.5px] leading-[1.55] text-white/70">{t('step1_body')}</p>
            <label className="flex items-start gap-2.5 text-[12.5px] text-white/70">
              <input
                type="checkbox"
                checked={acknowledged}
                onChange={(e) => setAcknowledged(e.target.checked)}
                className="mt-0.5 h-4 w-4 cursor-pointer accent-[#ff6b6b]"
              />
              {t('ack_label')}
            </label>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            <p className="text-[13.5px] leading-[1.55] text-white/70">
              {t.rich('step2_body', {
                email,
                strong: (chunks) => <strong className="text-white">{chunks}</strong>,
              })}
            </p>
            <input
              type="email"
              autoComplete="off"
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
              placeholder={email}
              aria-label={t('input_aria')}
              className="w-full rounded-[10px] border border-white/10 bg-white/[0.025] px-3.5 py-3 font-mono text-[13px] text-white placeholder:text-white/30 focus:outline-none focus-visible:border-[#ff6b6b] focus-visible:ring-2 focus-visible:ring-[#ff6b6b] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0D0A1A]"
            />
            {error && <p className="text-[12px] text-[#ff6b6b]">{error}</p>}
          </div>
        )}
        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-transparent px-4 py-2.5 text-[13px] font-semibold text-white/70 hover:bg-white/[0.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#0D0A1A]"
            disabled={pending}
          >
            {t('cancel')}
          </button>
          {step === 1 ? (
            <button
              type="button"
              onClick={() => setStep(2)}
              disabled={!acknowledged}
              className={cn(RED_BUTTON_CLASS, !acknowledged && 'opacity-40')}
            >
              {t('continue')}
            </button>
          ) : (
            <button
              type="button"
              onClick={onConfirm}
              disabled={pending || confirmation.length === 0}
              className={RED_BUTTON_CLASS}
            >
              {pending ? t('deleting') : t('confirm')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
