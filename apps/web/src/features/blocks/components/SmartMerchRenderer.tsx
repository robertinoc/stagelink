'use client';
/* eslint-disable @next/next/no-img-element */

import { ExternalLink, Shirt } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { SmartMerchBlockConfig } from '@stagelink/types';

interface SmartMerchRendererProps {
  title: string | null;
  config: SmartMerchBlockConfig;
}

function formatPrice(amount: string | null, currencyCode: string | null): string | null {
  if (!amount || !currencyCode) return null;

  const numericAmount = Number(amount);
  if (!Number.isFinite(numericAmount)) {
    return `${currencyCode} ${amount}`;
  }

  return `${currencyCode} ${numericAmount.toFixed(2)}`;
}

export function SmartMerchRenderer({ title, config }: SmartMerchRendererProps) {
  const t = useTranslations('blocks.renderer.smart_merch');
  const products = config.products ?? [];
  const isList = config.displayMode === 'list';

  if (products.length === 0) {
    return (
      <section className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-[0_20px_80px_rgba(0,0,0,0.22)] backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full border border-violet-400/20 bg-violet-500/10 text-violet-100">
            <Shirt className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-semibold tracking-wide text-zinc-100">
              {title ?? config.headline ?? t('title')}
            </h2>
            <p className="mt-1 text-sm text-zinc-400">{t('empty')}</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-[0_20px_80px_rgba(0,0,0,0.22)] backdrop-blur-sm">
      <div className="space-y-2">
        <h2 className="text-sm font-semibold tracking-wide text-zinc-100">
          {title ?? config.headline ?? t('title')}
        </h2>
        {config.subtitle ? (
          <p className="text-sm leading-7 text-zinc-300">{config.subtitle}</p>
        ) : null}
      </div>

      <div className={`mt-5 ${isList ? 'space-y-3' : 'grid gap-4 sm:grid-cols-2 xl:grid-cols-3'}`}>
        {products.map((product) => {
          const price = formatPrice(product.priceAmount, product.currencyCode);
          const canPurchase = product.availableForSale && Boolean(product.productUrl);
          return (
            <article
              key={product.id}
              className={`overflow-hidden rounded-2xl border border-white/10 bg-black/20 ${
                isList ? 'flex flex-col gap-4 p-4 sm:flex-row sm:items-center' : ''
              }`}
            >
              {product.imageUrl ? (
                <img
                  src={product.imageUrl}
                  alt={product.title}
                  className={
                    isList
                      ? 'h-28 w-full rounded-xl object-cover sm:w-36'
                      : 'h-48 w-full object-cover'
                  }
                  loading="lazy"
                />
              ) : (
                <div
                  className={`flex items-center justify-center bg-white/5 text-zinc-500 ${
                    isList ? 'h-28 w-full rounded-xl sm:w-36' : 'h-48 w-full'
                  }`}
                >
                  <Shirt className="h-8 w-8" />
                </div>
              )}

              <div className={`space-y-3 ${isList ? 'flex-1' : 'p-4'}`}>
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold text-white">{product.title}</h3>
                  {price ? <p className="text-sm text-zinc-300">{price}</p> : null}
                </div>

                <div className="flex items-center justify-between gap-3">
                  <span
                    className={`text-xs font-medium uppercase tracking-[0.16em] ${
                      product.availableForSale ? 'text-emerald-300' : 'text-zinc-500'
                    }`}
                  >
                    {product.availableForSale ? t('available') : t('sold_out')}
                  </span>

                  {canPurchase ? (
                    <a
                      href={product.productUrl!}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-center gap-2 rounded-full border border-violet-400/20 bg-violet-500/15 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-violet-500/25"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      {config.ctaLabel?.trim() || t('cta')}
                    </a>
                  ) : null}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
