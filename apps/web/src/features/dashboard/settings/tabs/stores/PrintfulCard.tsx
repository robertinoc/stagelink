'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Bento, BentoLabel } from '@/components/sl/Bento';
import { Btn } from '@/components/sl/Btn';
import { Pill } from '@/components/sl/SlPrimitives';
import { FieldInput } from '@/components/sl/FieldInput';
import { StoreCardHeader } from './StoreCardHeader';
import { ProductThumb } from './ProductThumb';
import { RED_BUTTON_CLASS } from '../plan/PlanDangerZone';

interface PrintfulCardProps {
  artistId: string;
  connected: boolean;
  storeName: string | null;
  storeId: string | null;
}

/**
 * Smart Merch (Printful) connection card. Uses the existing `/api/merch/*`
 * proxy routes — `storeName`/`storeId` should come from the merch
 * connection payload when available (else falls back to a generic label).
 */
export function PrintfulCard({ artistId, connected, storeName, storeId }: PrintfulCardProps) {
  const t = useTranslations('dashboard.settings.stores.printful');
  const [token, setToken] = useState('');
  const [saving, setSaving] = useState(false);
  const [validating, setValidating] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const onValidate = async () => {
    setValidating(true);
    setStatusMessage(null);
    try {
      const res = await fetch(`/api/artists/${artistId}/merch/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: token || undefined }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setStatusMessage(t('feedback.validate_ok'));
    } catch {
      setStatusMessage(t('feedback.validate_error'));
    } finally {
      setValidating(false);
    }
  };

  const onSave = async () => {
    setSaving(true);
    setStatusMessage(null);
    try {
      const res = await fetch(`/api/artists/${artistId}/merch`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: 'printful', ...(token ? { token } : {}) }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setStatusMessage(t('feedback.save_ok'));
      setToken('');
    } catch {
      setStatusMessage(t('feedback.save_error'));
    } finally {
      setSaving(false);
    }
  };

  const onDisconnect = async () => {
    try {
      const res = await fetch(`/api/artists/${artistId}/merch`, { method: 'DELETE' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      window.location.reload();
    } catch {
      setStatusMessage(t('feedback.save_error'));
    }
  };

  return (
    <Bento pad={0}>
      <StoreCardHeader
        name={t('header.name')}
        brand="#FE5B2D"
        emoji="🖼️"
        title={t('header.title')}
        hint={t('header.hint')}
        connected={connected}
        connectedLabel={t('header.connected')}
        disconnectedLabel={t('header.disconnected')}
      />
      <div className="space-y-4 px-6 py-5">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-[10px] border border-white/10 bg-white/[0.02] px-4 py-3">
          <div>
            <div className="text-[13px] font-semibold text-white">{t('provider.label')}</div>
            <p className="text-[11.5px] text-white/50">{t('provider.body')}</p>
          </div>
          <Pill tone="pink">Printful</Pill>
        </div>

        <FieldInput
          label={t('token.label')}
          hint={t('token.hint')}
          placeholder={t('token.placeholder')}
          value={token}
          onChange={(e) => setToken(e.target.value)}
          type="password"
          mono
          autoComplete="off"
        />

        {connected && (
          <div className="flex items-center gap-3 rounded-[10px] border border-[rgba(74,222,128,0.25)] bg-[rgba(74,222,128,0.10)] px-4 py-3">
            <span
              aria-hidden="true"
              className="inline-block h-2 w-2 rounded-full bg-[#4ADE80] shadow-[0_0_8px_rgba(74,222,128,0.6)]"
            />
            <div>
              <div className="text-[13px] font-semibold text-white">
                {storeName
                  ? t('connected.title_with_name', { name: storeName })
                  : t('connected.title_generic')}
              </div>
              {storeId && (
                <div className="font-mono text-[11.5px] text-white/50">
                  {t('connected.store_id', { id: storeId })}
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <Btn variant="ghost" type="button" onClick={onValidate} disabled={validating}>
            {validating ? t('feedback.validating') : t('actions.validate')}
          </Btn>
          <Btn variant="primary" type="button" onClick={onSave} disabled={saving}>
            {saving ? t('feedback.saving') : t('actions.save')}
          </Btn>
          {connected && (
            <button type="button" onClick={onDisconnect} className={RED_BUTTON_CLASS}>
              {t('actions.disconnect')}
            </button>
          )}
        </div>

        {statusMessage && (
          <div role="status" className="text-[12px] text-white/70">
            {statusMessage}
          </div>
        )}

        <div className="rounded-[14px] border border-white/10 bg-white/[0.025] p-4 sm:p-[18px]">
          <BentoLabel>{t('preview.label')}</BentoLabel>
          <p className="mb-3.5 mt-1 text-[12px] text-white/50">{t('preview.sub')}</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <ProductThumb name="Unisex Sweatshirt" index={0} simple />
            <ProductThumb name="Unisex organic oversized high neck t-shirt" index={1} simple />
          </div>
        </div>
      </div>
    </Bento>
  );
}
