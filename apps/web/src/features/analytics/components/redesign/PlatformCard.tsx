'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bento } from '@/components/sl/Bento';
import { Pill } from '@/components/sl/SlPrimitives';
import { Btn } from '@/components/sl/Btn';
import { RefreshCw, Settings, ExternalLink, Check, AlertCircle } from 'lucide-react';
import { formatFullDateTime } from '../../lib/format';

interface PlatformCardProps {
  brand: string;
  emoji: string;
  name: string;
  connectedLabel: string;
  tier: string;
  lastSyncIso: string | null;
  lastSyncLabel: string;
  openLabel: string;
  syncLabel: string;
  manageLabel: string;
  externalUrl: string | null;
  syncEndpoint?: string;
  footerNote?: string;
  /** Body content — metric grid + optional empty data note. */
  children: React.ReactNode;
  locale?: 'es' | 'en';
}

type SyncStatus = 'idle' | 'syncing' | 'success' | 'error';

const SYNC_FEEDBACK: Record<
  Exclude<SyncStatus, 'idle' | 'syncing'>,
  Record<'es' | 'en', string>
> = {
  success: { es: 'Sync exitoso', en: 'Sync successful' },
  error: { es: 'Error al sincronizar', en: 'Sync failed' },
};

export function PlatformCard({
  brand,
  emoji,
  name,
  connectedLabel,
  tier,
  lastSyncIso,
  lastSyncLabel,
  openLabel,
  syncLabel,
  manageLabel,
  externalUrl,
  syncEndpoint,
  footerNote,
  children,
  locale = 'es',
}: PlatformCardProps) {
  const router = useRouter();
  const [status, setStatus] = useState<SyncStatus>('idle');

  const syncing = status === 'syncing';

  async function handleSync() {
    if (!syncEndpoint || syncing) return;
    setStatus('syncing');
    try {
      const response = await fetch(syncEndpoint, { method: 'POST' });
      if (!response.ok) {
        throw new Error(`Sync responded with ${response.status}`);
      }
      setStatus('success');
      // Refresh server data so lastSyncIso + metrics update visually
      router.refresh();
    } catch {
      setStatus('error');
    } finally {
      // Auto-clear success/error after 3s so the user sees the feedback
      // but the card returns to its normal state.
      setTimeout(() => setStatus('idle'), 3000);
    }
  }

  return (
    <Bento pad={0}>
      <header
        className="flex flex-wrap items-start justify-between gap-3 border-b border-white/[0.08] px-6 py-5"
        style={{
          background: `radial-gradient(ellipse 60% 100% at 0% 0%, ${brand}1A 0%, transparent 60%)`,
        }}
      >
        <div className="flex items-center gap-3">
          <span
            aria-hidden="true"
            className="inline-flex h-12 w-12 items-center justify-center rounded-xl text-2xl"
            style={{ background: `${brand}24`, border: `1px solid ${brand}44` }}
          >
            {emoji}
          </span>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-[family-name:var(--font-heading)] text-[18px] font-bold text-white">
                {name}
              </span>
              <Pill tone="green">● {connectedLabel}</Pill>
              <Pill tone="yellow">{tier}</Pill>
            </div>
            <div className="mt-1 text-[12px] text-white/50">
              {lastSyncLabel}:{' '}
              {lastSyncIso
                ? formatFullDateTime(lastSyncIso, locale)
                : locale === 'es'
                  ? 'sin sync'
                  : 'never'}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {externalUrl && (
            <a
              href={externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.05] px-3 py-1.5 text-[12px] font-semibold text-white transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E040FB] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0D0A1A]"
              aria-label={`${openLabel} ${name}`}
            >
              <ExternalLink size={14} /> {openLabel} {name}
            </a>
          )}
          <div className="flex items-center gap-2">
            <Btn
              variant="ghost"
              size="sm"
              icon={<RefreshCw size={14} className={syncing ? 'animate-spin' : undefined} />}
              onClick={handleSync}
              disabled={!syncEndpoint || syncing}
              aria-label={`${syncLabel} ${name}`}
            >
              {syncLabel}
            </Btn>
            {/* Inline status feedback — auto-clears 3s after success/error */}
            {status === 'success' && (
              <span
                role="status"
                aria-live="polite"
                className="inline-flex items-center gap-1 rounded-full border border-[rgba(74,222,128,0.35)] bg-[rgba(74,222,128,0.12)] px-2.5 py-1 text-[11px] font-semibold text-[#4ADE80]"
              >
                <Check size={11} aria-hidden="true" /> {SYNC_FEEDBACK.success[locale]}
              </span>
            )}
            {status === 'error' && (
              <span
                role="status"
                aria-live="polite"
                className="inline-flex items-center gap-1 rounded-full border border-[rgba(255,107,107,0.35)] bg-[rgba(255,107,107,0.12)] px-2.5 py-1 text-[11px] font-semibold text-[#ff6b6b]"
              >
                <AlertCircle size={11} aria-hidden="true" /> {SYNC_FEEDBACK.error[locale]}
              </span>
            )}
          </div>
          <Btn
            variant="outline"
            size="sm"
            icon={<Settings size={14} />}
            aria-label={`${manageLabel} ${name}`}
          >
            {manageLabel}
          </Btn>
        </div>
      </header>
      <div className="p-[18px]">{children}</div>
      {footerNote && (
        <div className="mx-[18px] mb-[18px] rounded-lg border border-white/[0.08] bg-white/[0.025] px-3.5 py-2.5 text-[11.5px] leading-[1.5] text-white/50">
          <span aria-hidden="true" className="mr-1">
            ⓘ
          </span>
          {footerNote}
        </div>
      )}
    </Bento>
  );
}
