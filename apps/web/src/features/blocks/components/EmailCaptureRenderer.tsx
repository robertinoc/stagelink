'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import type { EmailCaptureBlockConfig } from '@stagelink/types';

// ─── Submission ───────────────────────────────────────────────────────────────
//
// POSTs to /api/public/blocks/:blockId/subscribers.
// The endpoint is implemented in T3-6 (public page). If not yet available,
// the renderer shows the error state — no silent failure.

async function submitEmail(blockId: string, email: string): Promise<void> {
  const res = await fetch(`/api/public/blocks/${blockId}/subscribers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
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
   * Block ID — required to POST subscriptions once the public API exists.
   * Pass undefined in dashboard preview (form will be non-functional).
   */
  blockId?: string;
}

type FormState = 'idle' | 'submitting' | 'success' | 'error';

/**
 * Renders an email capture block.
 *
 * Usage (dashboard preview — no blockId, form disabled):
 *   <EmailCaptureRenderer title={block.title} config={block.config as EmailCaptureBlockConfig} />
 *
 * Usage (public page — functional form):
 *   <EmailCaptureRenderer
 *     blockId={block.id}
 *     title={block.title}
 *     config={block.config as EmailCaptureBlockConfig}
 *   />
 */
export function EmailCaptureRenderer({ title, config, blockId }: EmailCaptureRendererProps) {
  const t = useTranslations('blocks.renderer.email_capture');

  const [email, setEmail] = useState('');
  const [formState, setFormState] = useState<FormState>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isPreview = !blockId;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!blockId || formState === 'submitting') return;

    const trimmed = email.trim();
    if (!trimmed || !trimmed.includes('@')) {
      setErrorMessage(t('invalid_email'));
      return;
    }

    setFormState('submitting');
    setErrorMessage(null);

    try {
      await submitEmail(blockId, trimmed);
      setFormState('success');
    } catch {
      setFormState('error');
      setErrorMessage(t('error'));
    }
  }

  if (formState === 'success') {
    return (
      <div className="rounded-xl border border-border bg-card p-6 text-center">
        {title && <h3 className="mb-1 text-base font-semibold">{title}</h3>}
        <p className="text-base font-semibold">{t('success_heading')}</p>
        <p className="mt-1 text-sm text-muted-foreground">{t('success_message')}</p>
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

      <form onSubmit={handleSubmit} className="mt-4 space-y-2" noValidate>
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
        />

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
