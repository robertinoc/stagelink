'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import type { EmailCaptureBlockConfig } from '@stagelink/types';

// ─── Submission ───────────────────────────────────────────────────────────────

interface SubmitPayload {
  email: string;
  consent?: boolean;
  website?: string; // honeypot — empty for real users, filled by bots
}

async function submitEmail(blockId: string, payload: SubmitPayload): Promise<void> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? '';
  const res = await fetch(`${apiUrl}/api/public/blocks/${blockId}/subscribers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { message?: string };
    throw new Error(body.message ?? `Request failed (${res.status})`);
  }
}

// ─── Renderer ─────────────────────────────────────────────────────────────────

interface EmailCaptureRendererProps {
  title?: string | null;
  config: EmailCaptureBlockConfig;
  /**
   * Block ID — required to POST subscriptions.
   * Pass undefined in dashboard preview (form will be non-functional).
   */
  blockId?: string;
}

type FormState = 'idle' | 'submitting' | 'success' | 'error';

/**
 * Renders an email capture block on the public page.
 *
 * Features:
 *   - Consent checkbox (shown when requireConsent=true or consentLabel is set)
 *   - Honeypot field (hidden, always sent empty — bots fill it, requests silently dropped)
 *   - Custom success message from block config
 *   - Loading / success / error states
 *   - Preview-safe (no blockId → form is non-functional with hint)
 */
export function EmailCaptureRenderer({ title, config, blockId }: EmailCaptureRendererProps) {
  const t = useTranslations('blocks.renderer.email_capture');

  const [email, setEmail] = useState('');
  const [consent, setConsent] = useState(false);
  const [honeypot, setHoneypot] = useState('');
  const [formState, setFormState] = useState<FormState>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isPreview = !blockId;
  const showConsentCheckbox = !!(config.requireConsent || config.consentLabel);
  const consentLabel = config.consentLabel ?? t('consent_default');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!blockId || formState === 'submitting') return;

    const trimmed = email.trim();
    // Use the browser's built-in email validator (same spec as input[type=email])
    // rather than a hand-rolled regex. Creates a temporary input to run checkValidity.
    const emailInput = document.createElement('input');
    emailInput.type = 'email';
    emailInput.value = trimmed;
    if (!trimmed || !emailInput.checkValidity()) {
      setErrorMessage(t('invalid_email'));
      return;
    }

    if (config.requireConsent && !consent) {
      setErrorMessage(t('consent_required'));
      return;
    }

    setFormState('submitting');
    setErrorMessage(null);

    try {
      await submitEmail(blockId, {
        email: trimmed,
        // Only send consent when the checkbox was shown to the user
        ...(showConsentCheckbox ? { consent } : {}),
        website: honeypot, // honeypot — real value from controlled input; empty for real users
      });
      setFormState('success');
    } catch {
      setFormState('error');
      setErrorMessage(t('error'));
    }
  }

  if (formState === 'success') {
    const successMsg = config.successMessage ?? t('success_message');
    return (
      <div className="rounded-xl border border-border bg-card p-6 text-center">
        {title && <h3 className="mb-2 text-base font-semibold">{title}</h3>}
        <p className="text-base font-semibold text-primary">{t('success_heading')}</p>
        <p className="mt-1 text-sm text-muted-foreground">{successMsg}</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      {title && <h3 className="mb-1 text-center text-base font-semibold">{title}</h3>}

      <p className="text-center text-base font-semibold">{config.headline}</p>

      {config.description && (
        <p className="mt-1 text-center text-sm text-muted-foreground">{config.description}</p>
      )}

      <form onSubmit={handleSubmit} className="mt-4 space-y-3" noValidate>
        {/*
         * Honeypot field — visually hidden, never filled by real users.
         * Bots that auto-fill inputs will fill this field; backend silently
         * drops those requests without revealing the protection.
         */}
        {/*
         * Honeypot — controlled input so the actual DOM value is captured and
         * sent in the JSON payload. Bots filling all visible+hidden fields will
         * populate this; the backend silently returns 200 without writing to DB.
         * readOnly removed: bots must be able to write here for the trap to work.
         */}
        <div aria-hidden="true" className="absolute -left-[9999px] -top-[9999px] opacity-0">
          <label htmlFor="ec-website">Website</label>
          <input
            id="ec-website"
            name="website"
            type="text"
            value={honeypot}
            onChange={(e) => setHoneypot(e.target.value)}
            tabIndex={-1}
            autoComplete="off"
          />
        </div>

        <input
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (errorMessage) setErrorMessage(null);
          }}
          placeholder={config.placeholder ?? t('email_placeholder')}
          disabled={isPreview || formState === 'submitting'}
          aria-label={t('email_placeholder')}
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-60"
          maxLength={254}
          autoComplete="email"
        />

        {showConsentCheckbox && (
          <label className="flex cursor-pointer items-start gap-2 text-sm text-muted-foreground select-none">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => {
                setConsent(e.target.checked);
                if (errorMessage) setErrorMessage(null);
              }}
              disabled={isPreview || formState === 'submitting'}
              className="mt-0.5 h-4 w-4 shrink-0 rounded border-input disabled:cursor-not-allowed"
            />
            <span>{consentLabel}</span>
          </label>
        )}

        {errorMessage && (
          <p role="alert" className="text-xs text-destructive">
            {errorMessage}
          </p>
        )}

        <button
          type="submit"
          disabled={isPreview || formState === 'submitting'}
          className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {formState === 'submitting' ? t('submitting') : config.buttonLabel}
        </button>

        {isPreview && (
          <p className="text-center text-xs text-muted-foreground">{t('preview_hint')}</p>
        )}
      </form>
    </div>
  );
}
