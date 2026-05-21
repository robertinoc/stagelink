'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Bento, BentoLabel } from '@/components/sl/Bento';
import { Btn } from '@/components/sl/Btn';
import { Pill } from '@/components/sl/SlPrimitives';
import { FieldInput } from '@/components/sl/FieldInput';
import { StoreCardHeader } from './StoreCardHeader';
import { ProductThumb } from './ProductThumb';
import { SegmentedPill } from './SegmentedPill';
import { RED_BUTTON_CLASS } from '../plan/PlanDangerZone';

interface ShopifyCardProps {
  artistId: string;
  initialDomain: string;
  initialMode: 'collection' | 'products';
  initialCollectionHandle: string;
  connected: boolean;
}

/**
 * Shopify storefront connection card. Fields are owned by client state so
 * the user can edit before pressing Guardar. Backend wiring uses the
 * existing `/api/shopify/*` proxy routes; the optional `?dry=true` flag
 * for cache-skipping validation is a follow-up.
 */
export function ShopifyCard({
  artistId,
  initialDomain,
  initialMode,
  initialCollectionHandle,
  connected,
}: ShopifyCardProps) {
  const t = useTranslations('dashboard.settings.stores.shopify');
  const [mode, setMode] = useState<'collection' | 'products'>(initialMode);
  const [domain, setDomain] = useState(initialDomain);
  const [token, setToken] = useState('');
  const [handle, setHandle] = useState(initialCollectionHandle);
  const [saving, setSaving] = useState(false);
  const [validating, setValidating] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const onValidate = async () => {
    setValidating(true);
    setStatusMessage(null);
    try {
      const res = await fetch(`/api/shopify/${artistId}/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain, token: token || undefined }),
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
      const res = await fetch(`/api/shopify/${artistId}/connect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domain,
          ...(token ? { token } : {}),
          mode,
          collectionHandle: handle,
        }),
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

  return (
    <Bento pad={0}>
      <StoreCardHeader
        name="Shopify"
        brand="#95BF47"
        emoji="🛒"
        title={t('header.title')}
        hint={t('header.hint')}
        connected={connected}
        connectedLabel={t('header.connected')}
        disconnectedLabel={t('header.disconnected')}
      />
      <div className="space-y-4 px-6 py-5">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FieldInput
            label={t('domain.label')}
            hint={t('domain.hint')}
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            placeholder="my-store.myshopify.com"
            mono
          />
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
        </div>

        <div className="space-y-2">
          <label className="text-[12.5px] font-medium text-white/70">{t('mode.label')}</label>
          <SegmentedPill
            value={mode}
            onChange={setMode}
            ariaLabel={t('mode.label')}
            options={[
              { value: 'collection', label: t('mode.collection') },
              { value: 'products', label: t('mode.products') },
            ]}
          />
        </div>

        {mode === 'collection' && (
          <FieldInput
            label={t('handle.label')}
            hint={t('handle.hint')}
            value={handle}
            onChange={(e) => setHandle(e.target.value)}
            placeholder="merch"
            mono
          />
        )}

        <div className="flex flex-wrap gap-2">
          <Btn variant="ghost" type="button" onClick={onValidate} disabled={validating || !domain}>
            {validating ? t('feedback.validating') : t('actions.validate')}
          </Btn>
          <Btn variant="primary" type="button" onClick={onSave} disabled={saving || !domain}>
            {saving ? t('feedback.saving') : t('actions.save')}
          </Btn>
          {connected && (
            <form action={`/api/shopify/${artistId}/disconnect`} method="POST">
              <button type="submit" className={RED_BUTTON_CLASS}>
                {t('actions.disconnect')}
              </button>
            </form>
          )}
        </div>

        {statusMessage && (
          <div role="status" className="text-[12px] text-white/70">
            {statusMessage}
          </div>
        )}

        <div className="rounded-[14px] border border-white/10 bg-white/[0.025] p-4 sm:p-[18px]">
          <div className="mb-3.5 flex flex-wrap items-center justify-between gap-2">
            <div>
              <BentoLabel>{t('preview.label')}</BentoLabel>
              <p className="mt-1 text-[12px] text-white/50">{t('preview.sub')}</p>
            </div>
            <Pill tone="green">
              {t('preview.collection_pill', { handle })}
            </Pill>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <ProductThumb name="Unisex Sweatshirt" price="ARS 28,032.50" index={0} />
            <ProductThumb
              name="Unisex organic oversized high neck t-shirt"
              price="ARS 37,202.00"
              index={1}
            />
            <ProductThumb
              name="Controlador DJ Native Instruments Maschine Jam"
              price="ARS 700,000.00"
              index={2}
            />
          </div>
        </div>
      </div>
    </Bento>
  );
}
