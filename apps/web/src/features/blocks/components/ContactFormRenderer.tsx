'use client';

import emailjs from '@emailjs/browser';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import type { ContactFormBlockConfig } from '@stagelink/types';

interface ContactFormRendererProps {
  blockId: string;
  title: string | null;
  config: ContactFormBlockConfig;
}

type Status = 'idle' | 'sending' | 'success' | 'error';
type ErrorKind = 'validation' | 'not_configured' | 'send_failed' | null;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function ContactFormRenderer({ title, config }: ContactFormRendererProps) {
  const t = useTranslations('blocks.renderer.contact_form');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [errorKind, setErrorKind] = useState<ErrorKind>(null);

  if (!config.email) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (status === 'sending') return;

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedMessage = message.trim();

    // Validación mínima — pareo con el patrón original de Resend (mensaje no vacío).
    if (!trimmedName || !trimmedMessage || !EMAIL_REGEX.test(trimmedEmail)) {
      setErrorKind('validation');
      setStatus('error');
      return;
    }

    const publicKey = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY;
    const serviceId = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID;
    const templateId = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID;
    if (!publicKey || !serviceId || !templateId) {
      // eslint-disable-next-line no-console
      console.error('[ContactForm] EmailJS env vars missing', {
        publicKey: Boolean(publicKey),
        serviceId: Boolean(serviceId),
        templateId: Boolean(templateId),
      });
      setErrorKind('not_configured');
      setStatus('error');
      return;
    }

    setStatus('sending');
    setErrorKind(null);
    try {
      const safeName = trimmedName.replace(/[\r\n\t]/g, '').slice(0, 100);
      const safeEmail = trimmedEmail.slice(0, 254);
      const safeMessage = trimmedMessage.slice(0, 2000);

      await emailjs.send(
        serviceId,
        templateId,
        {
          to_email: config.email,
          from_name: safeName,
          from_email: safeEmail,
          reply_to: safeEmail,
          subject: `Message from ${safeName} via StageLink`,
          message: safeMessage,
        },
        { publicKey },
      );
      setStatus('success');
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[ContactForm] EmailJS send failed', err);
      setErrorKind('send_failed');
      setStatus('error');
    }
  }

  const errorMessage =
    errorKind === 'validation'
      ? t('error_validation')
      : errorKind === 'not_configured'
        ? t('error_not_configured')
        : t('error');

  return (
    <div className="neon-card-border rounded-[1.5rem] p-[1px]">
      <section className="rounded-[1.4rem] bg-[#0b0614] p-6 shadow-[0_20px_80px_rgba(0,0,0,0.22)] backdrop-blur-sm">
        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.25em] text-zinc-500">
          {title ?? t('section_label')}
        </p>

        {status === 'success' ? (
          <div className="py-6 text-center">
            <p className="text-sm font-medium text-violet-300">{t('success_heading')}</p>
            <p className="mt-1 text-xs text-zinc-500">{t('success_body')}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-400">
                {t('name_label')}
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('name_placeholder')}
                disabled={status === 'sending'}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-violet-500/50 focus:outline-none disabled:opacity-50"
                maxLength={100}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-400">
                {t('email_label')}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('email_placeholder')}
                disabled={status === 'sending'}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-violet-500/50 focus:outline-none disabled:opacity-50"
                maxLength={254}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-400">
                {t('message_label')}
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={t('message_placeholder')}
                rows={4}
                disabled={status === 'sending'}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-violet-500/50 focus:outline-none disabled:opacity-50"
                maxLength={2000}
              />
            </div>
            {status === 'error' && <p className="text-xs text-red-400">{errorMessage}</p>}
            <button
              type="submit"
              disabled={!message.trim() || status === 'sending'}
              className="w-full rounded-full bg-white/10 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {status === 'sending' ? t('sending') : t('send_button')}
            </button>
          </form>
        )}
      </section>
    </div>
  );
}
