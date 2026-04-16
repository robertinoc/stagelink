'use client';
/* eslint-disable @next/next/no-img-element */

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import {
  getMinimumPlanForFeature,
  type ShopifyConnection,
  type ShopifySelectionMode,
} from '@stagelink/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { saveShopifyConnection, validateShopifyConnection } from '@/lib/api/shopify';

interface ShopifySettingsCardProps {
  artistId: string;
  currentPlanLabel: string;
  hasFeatureAccess: boolean;
  initialConnection: ShopifyConnection | null;
}

function parseHandlesInput(value: string): string[] {
  return value
    .split(/[\n,]/)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function serializeHandlesInput(handles: string[]): string {
  return handles.join('\n');
}

function resolvePlanLabel(plan: 'free' | 'pro' | 'pro_plus') {
  switch (plan) {
    case 'pro':
      return 'Pro';
    case 'pro_plus':
      return 'Pro+';
    default:
      return 'Free';
  }
}

export function ShopifySettingsCard({
  artistId,
  currentPlanLabel,
  hasFeatureAccess,
  initialConnection,
}: ShopifySettingsCardProps) {
  const t = useTranslations('dashboard.settings.shopify');
  const locale = useLocale();
  const [storeDomain, setStoreDomain] = useState(initialConnection?.storeDomain ?? '');
  const [storefrontToken, setStorefrontToken] = useState('');
  const [selectionMode, setSelectionMode] = useState<ShopifySelectionMode>(
    initialConnection?.selectionMode ?? 'collection',
  );
  const [collectionHandle, setCollectionHandle] = useState(
    initialConnection?.collectionHandle ?? '',
  );
  const [productHandlesInput, setProductHandlesInput] = useState(
    serializeHandlesInput(initialConnection?.productHandles ?? []),
  );
  const [connection, setConnection] = useState<ShopifyConnection | null>(initialConnection);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusTone, setStatusTone] = useState<'default' | 'success' | 'error'>('default');
  const [validating, setValidating] = useState(false);
  const [saving, setSaving] = useState(false);

  const previewProducts = connection?.previewProducts ?? [];
  const upgradeHref = `/${locale}/dashboard/billing`;
  const requiredPlanLabel = resolvePlanLabel(getMinimumPlanForFeature('shopify_integration'));
  const parsedProductHandles = useMemo(
    () => parseHandlesInput(productHandlesInput),
    [productHandlesInput],
  );

  async function handleValidate() {
    setValidating(true);
    setStatusMessage(null);
    try {
      const result = await validateShopifyConnection(artistId, {
        storeDomain,
        storefrontToken,
      });
      setStatusTone('success');
      setStatusMessage(result.message);
    } catch (error) {
      setStatusTone('error');
      setStatusMessage(error instanceof Error ? error.message : t('messages.validate_error'));
    } finally {
      setValidating(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    setStatusMessage(null);
    try {
      const saved = await saveShopifyConnection(artistId, {
        storeDomain,
        storefrontToken: storefrontToken.trim() || undefined,
        selectionMode,
        collectionHandle: selectionMode === 'collection' ? collectionHandle : null,
        productHandles: selectionMode === 'products' ? parsedProductHandles : [],
      });
      setConnection(saved);
      setStorefrontToken('');
      setStatusTone('success');
      setStatusMessage(t('messages.saved'));
    } catch (error) {
      setStatusTone('error');
      setStatusMessage(error instanceof Error ? error.message : t('messages.save_error'));
    } finally {
      setSaving(false);
    }
  }

  if (!hasFeatureAccess) {
    return (
      <Card className="border-primary/25 bg-primary/10">
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle>{t('title')}</CardTitle>
              <CardDescription>{t('lock.description')}</CardDescription>
            </div>
            <Badge variant="secondary">{requiredPlanLabel}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {t('lock.copy', { currentPlan: currentPlanLabel })}
          </p>
          <Button asChild>
            <Link href={upgradeHref}>{t('lock.cta')}</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle>{t('title')}</CardTitle>
            <CardDescription>{t('description')}</CardDescription>
          </div>
          <Badge variant={connection?.isConnected ? 'secondary' : 'outline'}>
            {connection?.isConnected ? t('status.connected') : t('status.not_connected')}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">{t('fields.store_domain')}</label>
            <Input
              value={storeDomain}
              onChange={(event) => setStoreDomain(event.target.value)}
              placeholder="artist-store.myshopify.com"
            />
            <p className="text-xs text-muted-foreground">{t('hints.store_domain')}</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">{t('fields.storefront_token')}</label>
            <Input
              type="password"
              value={storefrontToken}
              onChange={(event) => setStorefrontToken(event.target.value)}
              placeholder={connection?.hasStorefrontToken ? t('hints.token_saved') : 'shpst_***'}
            />
            <p className="text-xs text-muted-foreground">{t('hints.storefront_token')}</p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="space-y-2">
            <label className="text-sm font-medium">{t('fields.selection_mode')}</label>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant={selectionMode === 'collection' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectionMode('collection')}
              >
                {t('selection.collection')}
              </Button>
              <Button
                type="button"
                variant={selectionMode === 'products' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectionMode('products')}
              >
                {t('selection.products')}
              </Button>
            </div>
          </div>

          {selectionMode === 'collection' ? (
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('fields.collection_handle')}</label>
              <Input
                value={collectionHandle}
                onChange={(event) => setCollectionHandle(event.target.value)}
                placeholder="featured-drops"
              />
              <p className="text-xs text-muted-foreground">{t('hints.collection_handle')}</p>
            </div>
          ) : (
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('fields.product_handles')}</label>
              <Textarea
                value={productHandlesInput}
                onChange={(event) => setProductHandlesInput(event.target.value)}
                placeholder={'hoodie-black\nvinyl-edition'}
                rows={5}
              />
              <p className="text-xs text-muted-foreground">{t('hints.product_handles')}</p>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-3">
          <Button type="button" variant="outline" onClick={handleValidate} disabled={validating}>
            {validating ? t('actions_card.validating') : t('actions_card.validate')}
          </Button>
          <Button type="button" onClick={handleSave} disabled={saving}>
            {saving ? t('actions_card.saving') : t('actions_card.save')}
          </Button>
        </div>

        {statusMessage ? (
          <div
            className={`rounded-xl border px-4 py-3 text-sm ${
              statusTone === 'success'
                ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-100'
                : statusTone === 'error'
                  ? 'border-destructive/30 bg-destructive/10 text-destructive'
                  : 'border-white/10 bg-white/5 text-zinc-200'
            }`}
          >
            {statusMessage}
          </div>
        ) : null}

        {connection?.storeName ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-white">{connection.storeName}</p>
                <p className="text-xs text-muted-foreground">
                  {connection.storeDomain ?? t('status.not_connected')}
                </p>
              </div>
              <Badge variant="outline">
                {connection.selectionMode === 'collection'
                  ? t('selection.collection')
                  : t('selection.products')}
              </Badge>
            </div>

            {previewProducts.length > 0 ? (
              <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {previewProducts.map((product) => (
                  <div
                    key={product.id}
                    className="overflow-hidden rounded-2xl border border-white/10 bg-black/20"
                  >
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.title}
                        className="h-28 w-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="h-28 bg-white/5" />
                    )}
                    <div className="space-y-1 p-3">
                      <p className="text-sm font-medium text-white">{product.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {product.currencyCode} {product.priceAmount}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-4 text-sm text-muted-foreground">{t('messages.no_preview')}</p>
            )}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
