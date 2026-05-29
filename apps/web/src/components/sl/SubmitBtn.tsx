'use client';

// Form-aware submit button. Wraps Btn and disables itself + swaps the label
// for a spinner while the parent `<form action={serverAction}>` is pending.
// Use anywhere a Server Action submit needs immediate visual feedback.

import { useFormStatus } from 'react-dom';
import type { ComponentProps, ReactNode } from 'react';
import { Btn } from './Btn';

type BtnProps = ComponentProps<typeof Btn>;

interface SubmitBtnProps extends Omit<BtnProps, 'type'> {
  pendingLabel?: ReactNode;
}

export function SubmitBtn({ pendingLabel, children, disabled, ...rest }: SubmitBtnProps) {
  const { pending } = useFormStatus();
  return (
    <Btn {...rest} type="submit" disabled={pending || disabled} aria-busy={pending || undefined}>
      {pending ? (pendingLabel ?? <Spinner />) : children}
    </Btn>
  );
}

function Spinner() {
  return (
    <span
      className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent"
      aria-hidden="true"
    />
  );
}
