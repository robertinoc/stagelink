'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import type { ContactFormBlockConfig } from '@stagelink/types';

interface ContactFormRendererProps {
  title: string | null;
  config: ContactFormBlockConfig;
}

export function ContactFormRenderer({ title, config }: ContactFormRendererProps) {
  const t = useTranslations('blocks.renderer.contact_form');
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');

  if (!config.email) {
    return null;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const subject = encodeURIComponent(t('subject_template', { name: name || t('anonymous') }));
    const body = encodeURIComponent(message);
    window.open(`mailto:${config.email}?subject=${subject}&body=${body}`, '_blank');
  }

  return (
    <div className="neon-card-border rounded-[1.5rem] p-[1px]">
      <section className="rounded-[1.4rem] bg-[#0b0614] p-6 shadow-[0_20px_80px_rgba(0,0,0,0.22)] backdrop-blur-sm">
        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.25em] text-zinc-500">
          {title ?? t('section_label')}
        </p>
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
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-violet-500/50 focus:outline-none"
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
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-violet-500/50 focus:outline-none"
              maxLength={2000}
            />
          </div>
          <button
            type="submit"
            disabled={!message.trim()}
            className="w-full rounded-full bg-white/10 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {t('send_button')}
          </button>
        </form>
      </section>
    </div>
  );
}
