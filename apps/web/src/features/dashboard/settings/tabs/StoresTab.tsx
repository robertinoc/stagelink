'use client';

import { useTranslations } from 'next-intl';
import type { DashboardSettingsData } from '@/features/dashboard/settings/settings-data';
import { HelpBanner } from './connections/HelpBanner';
import { ShopifyCard } from './stores/ShopifyCard';
import { PrintfulCard } from './stores/PrintfulCard';
import { SettingsUpgradeGate } from './shared/SettingsUpgradeGate';

interface StoresTabProps {
  data: DashboardSettingsData;
  locale: string;
}

export function StoresTab({ data, locale }: StoresTabProps) {
  const t = useTranslations('dashboard.settings.stores');

  // Stores (Shopify storefront + Printful smart merch) are paid features.
  // Free plans see an upgrade gate instead of the connect forms.
  const ent = data.summary.entitlements;
  if (!ent.shopify_integration && !ent.smart_merch) {
    return (
      <SettingsUpgradeGate
        data={data}
        locale={locale}
        titleKey="stores.title"
        descriptionKey="stores.description"
      />
    );
  }

  const shopify = extractShopify(data);
  const merch = extractMerch(data);

  return (
    <div className="space-y-5">
      <HelpBanner
        title={t('help.title')}
        emoji="🛍️"
        tone="green"
        body={t.rich('help.body', {
          strong: (chunks) => <strong className="text-white">{chunks}</strong>,
        })}
      />

      <ShopifyCard
        artistId={data.artistId}
        initialDomain={shopify.domain}
        initialMode={shopify.mode}
        initialCollectionHandle={shopify.collectionHandle}
        connected={shopify.connected}
      />

      <PrintfulCard
        artistId={data.artistId}
        connected={merch.connected}
        storeName={merch.storeName}
        storeId={merch.storeId}
      />
    </div>
  );
}

function extractShopify(data: DashboardSettingsData) {
  const conn = data.shopifyConnection as unknown as Record<string, unknown> | null;
  if (!conn) {
    return {
      connected: false,
      domain: '',
      mode: 'collection' as const,
      collectionHandle: '',
    };
  }
  const domain = pickString(conn, 'storeDomain') ?? pickString(conn, 'domain') ?? '';
  const handle = pickString(conn, 'collectionHandle') ?? '';
  // Real field is `selectionMode` (ShopifyConnection); fall back to `mode`.
  const rawMode = pickString(conn, 'selectionMode') ?? pickString(conn, 'mode');
  const mode = rawMode === 'products' ? ('products' as const) : ('collection' as const);
  const isConnected =
    typeof conn['isConnected'] === 'boolean' ? (conn['isConnected'] as boolean) : true;
  return {
    connected: isConnected,
    domain,
    mode,
    collectionHandle: handle,
  };
}

function extractMerch(data: DashboardSettingsData) {
  const conn = data.merchConnection as unknown as Record<string, unknown> | null;
  if (!conn) {
    return { connected: false, storeName: null, storeId: null };
  }
  return {
    connected: true,
    storeName: pickString(conn, 'storeName') ?? pickString(conn, 'name') ?? null,
    storeId:
      pickString(conn, 'storeId') ??
      pickString(conn, 'externalStoreId') ??
      (typeof conn['storeId'] === 'number' ? String(conn['storeId']) : null),
  };
}

function pickString(obj: Record<string, unknown>, key: string): string | null {
  const value = obj[key];
  return typeof value === 'string' && value.length > 0 ? value : null;
}
