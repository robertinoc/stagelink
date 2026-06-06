'use client';

import { Button } from '@/components/ui/button';
import { useOpenStripePortal } from '@/lib/hooks/useOpenStripePortal';

interface OpenStripePortalButtonProps {
  artistId: string;
  children: React.ReactNode;
  variant?: 'default' | 'outline' | 'ghost' | 'secondary';
  disabled?: boolean;
  errorLabel: string;
}

/**
 * Opens the Stripe Customer Portal in a NEW TAB (every browser, incl. mobile
 * Safari) using the shared `useOpenStripePortal` hook. shadcn `Button` styling,
 * for the `/dashboard/billing` page. Replaces the previous
 * `<form action={startPortalAction}>` which redirected the current tab.
 */
export function OpenStripePortalButton({
  artistId,
  children,
  variant = 'outline',
  disabled,
  errorLabel,
}: OpenStripePortalButtonProps) {
  const { open, pending, error } = useOpenStripePortal(artistId);

  return (
    <div className="flex flex-col items-start gap-1">
      <Button
        type="button"
        variant={variant}
        onClick={open}
        disabled={disabled || pending}
        aria-busy={pending || undefined}
      >
        {children}
      </Button>
      {error ? <span className="text-xs text-destructive">{errorLabel}</span> : null}
    </div>
  );
}
