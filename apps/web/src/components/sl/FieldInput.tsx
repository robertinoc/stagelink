import { forwardRef, useId } from 'react';
import type { InputHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface FieldInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'className'> {
  label: string;
  hint?: string;
  /** Monospace font for tokens / URLs / IDs */
  mono?: boolean;
  /** Renders an action button next to the input (e.g. Validate) */
  trailing?: ReactNode;
  className?: string;
  containerClassName?: string;
  /** Visible only to screen readers when true (label still rendered) */
  hiddenLabel?: boolean;
}

/**
 * Composite label + input + hint used across the Settings tabs (Shopify
 * domain, Printful token, personal data). Honours the SL panel aesthetic
 * (frosted bg + magenta focus ring). Pass `type="password"` for tokens.
 */
export const FieldInput = forwardRef<HTMLInputElement, FieldInputProps>(function FieldInput(
  {
    label,
    hint,
    mono,
    trailing,
    containerClassName,
    className,
    hiddenLabel,
    id: providedId,
    type = 'text',
    ...rest
  },
  ref,
) {
  const reactId = useId();
  const id = providedId ?? `field-${reactId}`;
  const hintId = hint ? `${id}-hint` : undefined;

  return (
    <div className={cn('flex flex-col gap-2', containerClassName)}>
      <label
        htmlFor={id}
        className={cn(
          'text-[12.5px] font-medium text-white/70',
          hiddenLabel && 'sr-only',
        )}
      >
        {label}
      </label>
      <div className="flex flex-wrap items-stretch gap-2">
        <input
          ref={ref}
          id={id}
          type={type}
          aria-describedby={hintId}
          className={cn(
            'min-w-[260px] flex-1 rounded-[10px] border border-white/10 bg-[rgba(255,255,255,0.025)] px-3.5 py-3 text-[12.5px] text-white placeholder:text-white/30',
            'focus:outline-none focus-visible:border-[rgba(224,64,251,0.55)] focus-visible:ring-2 focus-visible:ring-[#E040FB] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0D0A1A]',
            'disabled:cursor-not-allowed disabled:opacity-60',
            mono && 'font-mono',
            className,
          )}
          {...rest}
        />
        {trailing}
      </div>
      {hint && (
        <p id={hintId} className="text-[11px] leading-[1.5] text-white/50">
          {hint}
        </p>
      )}
    </div>
  );
});
