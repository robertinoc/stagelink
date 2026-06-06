'use client';

import { Btn } from '@/components/sl/Btn';
import { useOpenStripePortal } from '@/lib/hooks/useOpenStripePortal';
import { cn } from '@/lib/utils';

interface OpenPortalButtonProps {
  artistId: string;
  children: React.ReactNode;
  variant?: 'primary' | 'ghost' | 'outline';
  /** When set, renders a bare <button> with this class instead of the Btn primitive (danger zone). */
  rawClassName?: string;
  errorLabel: string;
  /**
   * When set, deep-links the portal to the "switch to {targetPlan}"
   * confirmation screen (e.g. "Downgrade to Pro") instead of the generic
   * overview. Falls back to the generic portal if Stripe rejects the flow.
   */
  targetPlan?: 'pro' | 'pro_plus';
}

/**
 * Opens the Stripe Customer Portal in a NEW TAB across every browser (incl.
 * mobile Safari) via the shared `useOpenStripePortal` hook — see that hook for
 * the gesture-preservation details. Settings (sl/Btn) styling.
 */
export function OpenPortalButton({
  artistId,
  children,
  variant = 'ghost',
  rawClassName,
  errorLabel,
  targetPlan,
}: OpenPortalButtonProps) {
  const { open, pending, error } = useOpenStripePortal(artistId, { targetPlan });

  if (rawClassName) {
    return (
      <span className="inline-flex flex-col items-start gap-1">
        <button
          type="button"
          onClick={open}
          disabled={pending}
          aria-busy={pending || undefined}
          className={cn(rawClassName, pending && 'opacity-60')}
        >
          {children}
        </button>
        {error && <span className="text-[11px] text-[#ff6b6b]">{errorLabel}</span>}
      </span>
    );
  }

  return (
    <span className="inline-flex flex-col items-start gap-1">
      <Btn
        variant={variant}
        type="button"
        onClick={open}
        disabled={pending}
        aria-busy={pending || undefined}
      >
        {children}
      </Btn>
      {error && <span className="text-[11px] text-[#ff6b6b]">{errorLabel}</span>}
    </span>
  );
}
