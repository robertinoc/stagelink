'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import type { ContactFormBlockConfig } from '@stagelink/types';

interface ContactFormRendererProps {
  blockId: string;
  title: string | null;
  config: ContactFormBlockConfig;
}

type Status = 'idle' | 'sending' | 'success' | 'error';

export function ContactFormRenderer({ blockId, title, config }: ContactFormRendererProps) {
  const t = useTranslations('blocks.renderer.contact_form');
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<Status>('idle');

  if (!config.email) {
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim() || status === 'sending') return;

    setStatus('sending');
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? '';
      const res = await fetch(`${apiUrl}/api/public/blocks/${blockId}/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() || t('anonymous'), message: message.trim() }),
      });

      if (!res.ok) throw new Error('send_failed');
      setStatus('success');
    } catch {
      setStatus('error');
    }
  }

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
            {status === 'error' && <p className="text-xs text-red-400">{t('error')}</p>}
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
