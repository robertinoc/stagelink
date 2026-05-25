'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { StageLinkInsightsConnection } from '@stagelink/types';
import { Bento } from '@/components/sl/Bento';
import { Btn } from '@/components/sl/Btn';
import { Pill } from '@/components/sl/SlPrimitives';
import { FieldInput } from '@/components/sl/FieldInput';
import { RED_BUTTON_CLASS } from '../plan/PlanDangerZone';
import {
  disconnectSpotifyInsightsConnection,
  disconnectYouTubeInsightsConnection,
  saveSpotifyInsightsConnection,
  saveYouTubeInsightsConnection,
  syncSpotifyInsightsConnection,
  syncYouTubeInsightsConnection,
  validateSpotifyInsightsConnection,
  validateYouTubeInsightsConnection,
} from '@/lib/api/insights';

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
  disconnecting: string;
  disconnect_confirm: string;
  validate: string;
  connect: string;
  update_connection: string;
  validating: string;
  saving: string;
  syncing: string;
  sync: string;
  validate_error: string;
  save_error: string;
  sync_error: string;
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
  /** Pre-resolved connection from the insights dashboard (null if none). */
  connection: StageLinkInsightsConnection | null;
  /** Artist-profile saved URL used to seed the input when not yet connected. */
  artistSavedUrl: string | null;
  locale: string;
  copy: ConnectionCardCopy;
}

/**
 * Per-platform action wrappers. Spotify's payload key is `artistInput`,
 * YouTube's is `channelInput`, so we normalise to a single `input: string`
 * arg here and let each wrapper build the right payload. Validate + sync
 * results both expose `.message`, normalised to `{ message }`.
 */
interface ConnectionFns {
  validate: (artistId: string, input: string) => Promise<{ message: string }>;
  save: (artistId: string, input: string) => Promise<unknown>;
  sync: (artistId: string) => Promise<{ message: string }>;
  disconnect: (artistId: string) => Promise<void>;
}

const PLATFORM_FNS: Record<ConnectionPlatform, ConnectionFns> = {
  spotify: {
    validate: (id, input) => validateSpotifyInsightsConnection(id, { artistInput: input }),
    save: (id, input) => saveSpotifyInsightsConnection(id, { artistInput: input }),
    sync: (id) => syncSpotifyInsightsConnection(id),
    disconnect: (id) => disconnectSpotifyInsightsConnection(id),
  },
  youtube: {
    validate: (id, input) => validateYouTubeInsightsConnection(id, { channelInput: input }),
    save: (id, input) => saveYouTubeInsightsConnection(id, { channelInput: input }),
    sync: (id) => syncYouTubeInsightsConnection(id),
    disconnect: (id) => disconnectYouTubeInsightsConnection(id),
  },
};

/**
 * Connection card for Spotify / YouTube. StageLink Insights uses a
 * paste-URL → validate → save model (NOT OAuth), so the input is editable
 * and the actions hit the real insights endpoints:
 *   Validar  → validate{Platform}InsightsConnection({ artistInput })
 *   Conectar/Actualizar → save{Platform}InsightsConnection({ artistInput })
 *   Re-sync  → sync{Platform}InsightsConnection()
 *   Desconectar → disconnect{Platform}InsightsConnection()
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
  connection,
  artistSavedUrl,
  locale,
  copy,
}: ConnectionCardProps) {
  const router = useRouter();
  const fns = PLATFORM_FNS[platform];

  const seededInput =
    connection?.externalUrl ?? connection?.externalAccountId ?? artistSavedUrl ?? '';
  const [artistInput, setArtistInput] = useState(seededInput);
  const [status, setStatus] = useState<'idle' | 'ok' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [validating, setValidating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  useEffect(() => {
    setArtistInput(seededInput);
  }, [seededInput]);

  const connected = connection?.status === 'connected';
  const lastSync = formatDate(connection?.lastSyncedAt ?? null, locale);
  const externalUrl = connection?.externalUrl ?? null;

  const onValidate = async () => {
    setValidating(true);
    setStatus('idle');
    setStatusMessage(null);
    try {
      const result = await fns.validate(artistId, artistInput);
      setStatus('ok');
      setStatusMessage(result.message);
    } catch (e) {
      setStatus('error');
      setStatusMessage(e instanceof Error ? e.message : copy.validate_error);
    } finally {
      setValidating(false);
    }
  };

  const onSave = async () => {
    setSaving(true);
    setStatus('idle');
    setStatusMessage(null);
    try {
      await fns.save(artistId, artistInput);
      setStatus('ok');
      router.refresh();
    } catch (e) {
      setStatus('error');
      setStatusMessage(e instanceof Error ? e.message : copy.save_error);
    } finally {
      setSaving(false);
    }
  };

  const onSync = async () => {
    setSyncing(true);
    setStatus('idle');
    setStatusMessage(null);
    try {
      const result = await fns.sync(artistId);
      setStatus('ok');
      setStatusMessage(result.message);
      router.refresh();
    } catch (e) {
      setStatus('error');
      setStatusMessage(e instanceof Error ? e.message : copy.sync_error);
    } finally {
      setSyncing(false);
    }
  };

  const onDisconnect = async () => {
    if (!window.confirm(copy.disconnect_confirm)) return;
    setDisconnecting(true);
    setStatus('idle');
    setStatusMessage(null);
    try {
      await fns.disconnect(artistId);
      router.refresh();
    } catch (e) {
      setStatus('error');
      setStatusMessage(e instanceof Error ? e.message : copy.sync_error);
    } finally {
      setDisconnecting(false);
    }
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
            style={{ background: `${brand}18`, borderColor: `${brand}44` }}
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
          value={artistInput}
          onChange={(e) => setArtistInput(e.target.value)}
          placeholder={placeholder}
          mono
          trailing={
            <div className="flex flex-wrap gap-2">
              <Btn
                variant="ghost"
                type="button"
                onClick={onValidate}
                disabled={validating || artistInput.trim().length === 0}
              >
                {validating ? copy.validating : copy.validate}
              </Btn>
              <Btn
                variant="primary"
                type="button"
                onClick={onSave}
                disabled={saving || artistInput.trim().length === 0}
              >
                {saving ? copy.saving : connected ? copy.update_connection : copy.connect}
              </Btn>
            </div>
          }
        />

        {status !== 'idle' && statusMessage && (
          <div
            role="status"
            className={
              status === 'ok' ? 'text-[12px] text-[#4ADE80]' : 'text-[12px] text-[#ff6b6b]'
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
              <Btn variant="ghost" type="button" onClick={onSync} disabled={syncing}>
                {syncing ? copy.syncing : copy.sync}
              </Btn>
              <a href={`/${locale}/dashboard/analytics`}>
                <Btn variant="ghost" type="button" iconRight={<ChartIcon />}>
                  {copy.view_analytics}
                </Btn>
              </a>
              <button
                type="button"
                onClick={onDisconnect}
                disabled={disconnecting}
                className={RED_BUTTON_CLASS}
              >
                {disconnecting ? copy.disconnecting : copy.disconnect}
              </button>
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

function formatDate(value: string | null, locale: string): string | null {
  if (!value) return null;
  try {
    return new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(
      new Date(value),
    );
  } catch {
    return value;
  }
}

function ExternalIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  );
}

function ChartIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  );
}
