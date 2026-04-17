'use client';
/* eslint-disable @next/next/no-img-element */

import { useState } from 'react';
import Link from 'next/link';
import { Shirt } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { getMinimumPlanForFeature, type MerchProviderConnection } from '@stagelink/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { saveMerchConnection, validateMerchConnection } from '@/lib/api/merch';

interface MerchProviderSettingsCardProps {
  artistId: string;
  currentPlanLabel: string;
  hasFeatureAccess: boolean;
  initialConnection: MerchProviderConnection | null;
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

function formatPrice(amount: string | null, currencyCode: string | null): string | null {
  if (!amount || !currencyCode) return null;
  const numericAmount = Number(amount);
  if (!Number.isFinite(numericAmount)) {
    return `${currencyCode} ${amount}`;
  }
  return `${currencyCode} ${numericAmount.toFixed(2)}`;
}

export function MerchProviderSettingsCard({
  artistId,
  currentPlanLabel,
  hasFeatureAccess,
  initialConnection,
}: MerchProviderSettingsCardProps) {
  const t = useTranslations('dashboard.settings.merch');
  const locale = useLocale();
  const [apiToken, setApiToken] = useState('');
  const [connection, setConnection] = useState<MerchProviderConnection | null>(initialConnection);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusTone, setStatusTone] = useState<'default' | 'success' | 'error'>('default');
  const [validating, setValidating] = useState(false);
  const [saving, setSaving] = useState(false);

  const upgradeHref = `/${locale}/dashboard/billing`;
  const requiredPlanLabel = resolvePlanLabel(getMinimumPlanForFeature('smart_merch'));
  const previewProducts = connection?.previewProducts ?? [];

  async function handleValidate() {
    setValidating(true);
    setStatusMessage(null);
    try {
      const result = await validateMerchConnection(artistId, {
        provider: 'printful',
        apiToken,
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
      const saved = await saveMerchConnection(artistId, {
        provider: 'printful',
        apiToken: apiToken.trim() || undefined,
      });
      setConnection(saved);
      setApiToken('');
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
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-foreground">{t('fields.provider')}</p>
              <p className="text-xs text-muted-foreground">{t('hints.provider')}</p>
            </div>
            <Badge variant="outline">Printful</Badge>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">{t('fields.api_token')}</label>
          <Input
            type="password"
            value={apiToken}
            onChange={(event) => setApiToken(event.target.value)}
            placeholder={connection?.hasApiToken ? t('hints.token_saved') : 'pf_***'}
          />
          <p className="text-xs text-muted-foreground">{t('hints.api_token')}</p>
        </div>

        {connection?.storeName ? (
          <div className="rounded-xl border border-emerald-400/20 bg-emerald-500/10 p-4">
            <p className="text-sm font-medium text-emerald-100">
              {t('store.connected_to', { name: connection.storeName })}
            </p>
            {connection.storeId ? (
              <p className="mt-1 text-xs text-emerald-200/80">
                {t('store.store_id', { id: connection.storeId })}
              </p>
            ) : null}
          </div>
        ) : null}

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
                ? 'border-emerald-400/25 bg-emerald-500/10 text-emerald-100'
                : statusTone === 'error'
                  ? 'border-destructive/30 bg-destructive/10 text-destructive'
                  : 'border-border bg-muted/30 text-muted-foreground'
            }`}
          >
            {statusMessage}
          </div>
        ) : null}

        <div className="space-y-3">
          <div>
            <p className="text-sm font-medium">{t('preview.title')}</p>
            <p className="text-xs text-muted-foreground">{t('preview.description')}</p>
          </div>

          {previewProducts.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
              {t('messages.no_preview')}
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {previewProducts.map((product) => (
                <div
                  key={product.id}
                  className="overflow-hidden rounded-2xl border border-white/10 bg-black/10"
                >
                  {product.imageUrl ? (
                    <img
                      src={product.imageUrl}
                      alt={product.title}
                      className="h-36 w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-36 items-center justify-center bg-white/5 text-muted-foreground">
                      <Shirt className="h-6 w-6" />
                    </div>
                  )}
                  <div className="space-y-2 p-4">
                    <p className="text-sm font-medium text-foreground">{product.title}</p>
                    {formatPrice(product.priceAmount, product.currencyCode) ? (
                      <p className="text-sm text-muted-foreground">
                        {formatPrice(product.priceAmount, product.currencyCode)}
                      </p>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
