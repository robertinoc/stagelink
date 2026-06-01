'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import type { ShopifySelectionMode } from '@stagelink/types';
import { Bento, BentoLabel } from '@/components/sl/Bento';
import { Btn } from '@/components/sl/Btn';
import { Pill } from '@/components/sl/SlPrimitives';
import { FieldInput } from '@/components/sl/FieldInput';
import {
  disconnectShopifyConnection,
  saveShopifyConnection,
  validateShopifyConnection,
} from '@/lib/api/shopify';
import { StoreCardHeader } from './StoreCardHeader';
import { ProductThumb } from './ProductThumb';
import { SegmentedPill } from './SegmentedPill';
import { ConfirmDialog } from '../shared/ConfirmDialog';
import { RED_BUTTON_CLASS } from '../plan/PlanDangerZone';

type Mode = 'collection' | 'products';

interface ShopifyCardProps {
  artistId: string;
  initialDomain: string;
  initialMode: Mode;
  initialCollectionHandle: string;
  connected: boolean;
}

/**
 * Shopify storefront connection card. Wires to the real client functions in
 * `@/lib/api/shopify` (PATCH/DELETE `/api/artists/{id}/shopify`, POST
 * `/shopify/validate`) with the correct payload field names
 * (storeDomain / storefrontToken / selectionMode). A prior version sent
 * { domain, token, mode } which the backend DTO rejected → "Could not save".
 */
export function ShopifyCard({
  artistId,
  initialDomain,
  initialMode,
  initialCollectionHandle,
  connected: initialConnected,
}: ShopifyCardProps) {
  const t = useTranslations('dashboard.settings.stores.shopify');
  const [mode, setMode] = useState<Mode>(initialMode);
  const [domain, setDomain] = useState(initialDomain);
  const [token, setToken] = useState('');
  const [handle, setHandle] = useState(initialCollectionHandle);
  const [connected, setConnected] = useState(initialConnected);
  const [saving, setSaving] = useState(false);
  const [validating, setValidating] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusTone, setStatusTone] = useState<'ok' | 'error'>('ok');

  const toSelectionMode = (m: Mode): ShopifySelectionMode =>
    (m === 'products' ? 'products' : 'collection') as ShopifySelectionMode;

  const onValidate = async () => {
    setValidating(true);
    setStatusMessage(null);
    try {
      const result = await validateShopifyConnection(artistId, {
        storeDomain: domain,
        storefrontToken: token,
      });
      setStatusTone(result.ok ? 'ok' : 'error');
      setStatusMessage(result.message || t('feedback.validate_ok'));
    } catch (e) {
      setStatusTone('error');
      setStatusMessage(e instanceof Error ? e.message : t('feedback.validate_error'));
    } finally {
      setValidating(false);
    }
  };

  const onSave = async () => {
    setSaving(true);
    setStatusMessage(null);
    try {
      await saveShopifyConnection(artistId, {
        storeDomain: domain,
        ...(token ? { storefrontToken: token } : {}),
        selectionMode: toSelectionMode(mode),
        collectionHandle: handle || null,
      });
      setConnected(true);
      setStatusTone('ok');
      setStatusMessage(t('feedback.save_ok'));
      setToken('');
    } catch (e) {
      setStatusTone('error');
      setStatusMessage(e instanceof Error ? e.message : t('feedback.save_error'));
    } finally {
      setSaving(false);
    }
  };

  const onConfirmDisconnect = async () => {
    setDisconnecting(true);
    try {
      await disconnectShopifyConnection(artistId);
      setConnected(false);
      setConfirmOpen(false);
      setStatusTone('ok');
      setStatusMessage(t('feedback.disconnected'));
    } catch (e) {
      setStatusTone('error');
      setStatusMessage(e instanceof Error ? e.message : t('feedback.disconnect_error'));
    } finally {
      setDisconnecting(false);
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
            <button type="button" onClick={() => setConfirmOpen(true)} className={RED_BUTTON_CLASS}>
              {t('actions.disconnect')}
            </button>
          )}
        </div>

        {statusMessage && (
          <div
            role="status"
            className={
              statusTone === 'ok' ? 'text-[12px] text-[#4ADE80]' : 'text-[12px] text-[#ff6b6b]'
            }
          >
            {statusMessage}
          </div>
        )}

        <div className="rounded-[14px] border border-white/10 bg-white/[0.025] p-4 sm:p-[18px]">
          <div className="mb-3.5 flex flex-wrap items-center justify-between gap-2">
            <div>
              <BentoLabel>{t('preview.label')}</BentoLabel>
              <p className="mt-1 text-[12px] text-white/50">{t('preview.sub')}</p>
            </div>
            <Pill tone="green">{t('preview.collection_pill', { handle })}</Pill>
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

      <ConfirmDialog
        open={confirmOpen}
        title={t('disconnect_confirm.title')}
        body={t('disconnect_confirm.body')}
        confirmLabel={t('actions.disconnect')}
        cancelLabel={t('disconnect_confirm.cancel')}
        pendingLabel={t('feedback.disconnecting')}
        pending={disconnecting}
        onConfirm={onConfirmDisconnect}
        onCancel={() => setConfirmOpen(false)}
      />
    </Bento>
  );
}
