'use client';

import { useState } from 'react';
import { Btn } from '@/components/sl/Btn';
import { cn } from '@/lib/utils';

interface OpenPortalButtonProps {
  artistId: string;
  children: React.ReactNode;
  variant?: 'primary' | 'ghost' | 'outline';
  /** When set, renders a bare <button> with this class instead of the Btn primitive (danger zone). */
  rawClassName?: string;
  errorLabel: string;
}

/**
 * Opens the Stripe Customer Portal in a NEW TAB. Fetches the portal URL from
 * the web proxy (`/api/billing/{id}/portal`) and window.open()s it, so the
 * dashboard tab is preserved (the old server-action approach redirected the
 * current tab). Falls back to an inline error if the portal can't be created.
 */
export function OpenPortalButton({
  artistId,
  children,
  variant = 'ghost',
  rawClassName,
  errorLabel,
}: OpenPortalButtonProps) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(false);

  const open = async () => {
    setPending(true);
    setError(false);
    try {
      const res = await fetch(`/api/billing/${artistId}/portal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ returnUrl: window.location.href }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const { url } = (await res.json()) as { url?: string };
      if (!url) throw new Error('no url');
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch {
      setError(true);
    } finally {
      setPending(false);
    }
  };

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
