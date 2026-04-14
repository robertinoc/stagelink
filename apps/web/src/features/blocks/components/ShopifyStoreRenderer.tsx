'use client';
/* eslint-disable @next/next/no-img-element */

import { ShoppingBag } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { ShopifyStoreBlockConfig } from '@stagelink/types';

interface ShopifyStoreRendererProps {
  title: string | null;
  config: ShopifyStoreBlockConfig;
}

function formatPrice(amount: string, currencyCode: string): string {
  const numericAmount = Number(amount);
  if (!Number.isFinite(numericAmount)) {
    return `${currencyCode} ${amount}`;
  }

  return `${currencyCode} ${numericAmount.toFixed(2)}`;
}

export function ShopifyStoreRenderer({ title, config }: ShopifyStoreRendererProps) {
  const t = useTranslations('blocks.renderer.shopify_store');
  const products = config.products ?? [];

  if (products.length === 0) {
    return (
      <section className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-[0_20px_80px_rgba(0,0,0,0.22)] backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full border border-violet-400/20 bg-violet-500/10 text-violet-100">
            <ShoppingBag className="h-5 w-5" />
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
        {config.description ? (
          <p className="text-sm leading-7 text-zinc-300">{config.description}</p>
        ) : null}
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {products.map((product) => (
          <article
            key={product.id}
            className="overflow-hidden rounded-2xl border border-white/10 bg-black/20"
          >
            {product.imageUrl ? (
              <img
                src={product.imageUrl}
                alt={product.title}
                className="h-48 w-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="flex h-48 items-center justify-center bg-white/5 text-zinc-500">
                <ShoppingBag className="h-8 w-8" />
              </div>
            )}

            <div className="space-y-3 p-4">
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-white">{product.title}</h3>
                <p className="text-sm text-zinc-300">
                  {formatPrice(product.priceAmount, product.currencyCode)}
                </p>
              </div>

              <div className="flex items-center justify-between gap-3">
                <span
                  className={`text-xs font-medium uppercase tracking-[0.16em] ${
                    product.availableForSale ? 'text-emerald-300' : 'text-zinc-500'
                  }`}
                >
                  {product.availableForSale ? t('available') : t('sold_out')}
                </span>

                {product.productUrl ? (
                  <a
                    href={product.productUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center rounded-full border border-violet-400/20 bg-violet-500/15 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-violet-500/25"
                  >
                    {config.ctaLabel?.trim() || t('cta')}
                  </a>
                ) : null}
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
