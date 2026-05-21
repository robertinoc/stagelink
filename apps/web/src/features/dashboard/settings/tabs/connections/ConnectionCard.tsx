'use client';

import { useState, useTransition } from 'react';
import { Bento } from '@/components/sl/Bento';
import { Btn } from '@/components/sl/Btn';
import { Pill } from '@/components/sl/SlPrimitives';
import { FieldInput } from '@/components/sl/FieldInput';
import { RED_BUTTON_CLASS } from '../plan/PlanDangerZone';

export type ConnectionPlatform = 'spotify' | 'youtube';

export interface ConnectionCardCopy {
  status_connected: string;
  status_disconnected: string;
  last_sync: string;
  connected_ok: string;
  snapshots_note: string;
  open_in_platform: string;
  view_analytics: string;
  disconnect: string;
  validate: string;
  update_connection: string;
  validating: string;
  syncing: string;
  validate_success: string;
  validate_error: string;
}

interface ConnectionCardProps {
  platform: ConnectionPlatform;
  artistId: string;
  brand: string;
  emoji: string;
  name: string;
  title: string;
  hint: string;
  inputLabel: string;
  inputHint: string;
  placeholder: string;
  tier?: { label: string } | null;
  tip: string;
  connected: boolean;
  connectionUrl: string | null;
  lastSync: string | null;
  /** Path on the platform site this connection points to (e.g. open.spotify.com/artist/...) */
  externalUrl: string | null;
  /** Locale for the link to Analytics */
  locale: string;
  copy: ConnectionCardCopy;
}

/**
 * Connection card for Spotify / YouTube. The "input" surface mirrors the
 * URL stored from the OAuth flow (read-only). `Validar` re-checks the
 * stored connection by hitting the validate proxy. `Actualizar conexión`
 * re-launches the OAuth flow by sending the user to the auth endpoint.
 * `Desconectar` POSTs to the disconnect endpoint.
 */
export function ConnectionCard({
  platform,
  artistId,
  brand,
  emoji,
  name,
  title,
  hint,
  inputLabel,
  inputHint,
  placeholder,
  tier,
  tip,
  connected,
  connectionUrl,
  lastSync,
  externalUrl,
  locale,
  copy,
}: ConnectionCardProps) {
  const [status, setStatus] = useState<'idle' | 'ok' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isValidating, startValidate] = useTransition();

  const onValidate = () => {
    startValidate(async () => {
      try {
        const res = await fetch(`/api/insights/${artistId}/${platform}/validate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        setStatus('ok');
        setStatusMessage(copy.validate_success);
      } catch {
        setStatus('error');
        setStatusMessage(copy.validate_error);
      }
    });
  };

  return (
    <Bento pad={0}>
      <div
        className="flex flex-wrap items-start justify-between gap-4 border-b border-white/10 px-6 py-5"
        style={{
          background: `radial-gradient(ellipse 60% 100% at 0% 0%, ${brand}1a 0%, transparent 60%)`,
        }}
      >
        <div className="flex min-w-0 gap-3.5">
          <div
            aria-hidden="true"
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[12px] border text-xl"
            style={{
              background: `${brand}18`,
              borderColor: `${brand}44`,
            }}
          >
            {emoji}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="m-0 font-[family-name:var(--font-heading)] text-[18px] font-bold text-white">
                {name}
              </h3>
              {connected ? (
                <Pill tone="green">● {copy.status_connected}</Pill>
              ) : (
                <Pill tone="neutral">{copy.status_disconnected}</Pill>
              )}
              {tier && <Pill tone="yellow">{tier.label}</Pill>}
            </div>
            <p className="mt-1 text-[12px] text-white/50">
              <strong className="text-white/70">{title}</strong> · {hint}
            </p>
          </div>
        </div>
        {connected && lastSync && (
          <div className="font-[family-name:var(--font-heading)] text-[11px] tracking-[0.3px] text-white/50">
            {copy.last_sync} · {lastSync}
          </div>
        )}
      </div>

      <div className="space-y-4 px-6 py-5">
        <FieldInput
          label={inputLabel}
          hint={inputHint}
          value={connectionUrl ?? ''}
          placeholder={placeholder}
          readOnly
          mono
          aria-readonly="true"
          trailing={
            <div className="flex flex-wrap gap-2">
              <Btn
                variant="ghost"
                type="button"
                onClick={onValidate}
                disabled={isValidating || !connected}
              >
                {isValidating ? copy.validating : copy.validate}
              </Btn>
              <form action={`/api/auth/${platform}/connect`} method="GET">
                <input type="hidden" name="artistId" value={artistId} />
                <Btn variant="primary" type="submit">
                  {copy.update_connection}
                </Btn>
              </form>
            </div>
          }
        />

        {status !== 'idle' && statusMessage && (
          <div
            role="status"
            className={
              status === 'ok'
                ? 'text-[12px] text-[#4ADE80]'
                : 'text-[12px] text-[#ff6b6b]'
            }
          >
            {statusMessage}
          </div>
        )}

        {connected && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-[12px] border border-white/10 bg-white/[0.02] px-4 py-3.5">
            <div className="flex items-center gap-2.5">
              <span
                aria-hidden="true"
                className="inline-block h-2 w-2 rounded-full bg-[#4ADE80] shadow-[0_0_8px_rgba(74,222,128,0.6)]"
              />
              <span className="text-[13px] font-semibold text-white">{copy.connected_ok}</span>
              <span className="text-[12px] text-white/50">· {copy.snapshots_note}</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {externalUrl && (
                <a href={externalUrl} target="_blank" rel="noopener noreferrer">
                  <Btn variant="ghost" type="button" iconRight={<ExternalIcon />}>
                    {copy.open_in_platform}
                  </Btn>
                </a>
              )}
              <a href={`/${locale}/dashboard/analytics`}>
                <Btn variant="ghost" type="button" iconRight={<ChartIcon />}>
                  {copy.view_analytics}
                </Btn>
              </a>
              <form action={`/api/insights/${artistId}/${platform}/disconnect`} method="POST">
                <button type="submit" className={RED_BUTTON_CLASS}>
                  {copy.disconnect}
                </button>
              </form>
            </div>
          </div>
        )}

        <div className="flex gap-2 rounded-[8px] border border-white/10 bg-white/[0.025] px-3.5 py-2.5 text-[11.5px] leading-[1.5] text-white/50">
          <span aria-hidden="true">ⓘ</span>
          <span>{tip}</span>
        </div>
      </div>
    </Bento>
  );
}

function ExternalIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  );
}

function ChartIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  );
}
