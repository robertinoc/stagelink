import { BadRequestException, Injectable, ServiceUnavailableException } from '@nestjs/common';
import type { SmartMerchProduct } from '@stagelink/types';
import {
  normalizeMerchPreviewLimit,
  normalizePriceAmount,
  normalizePrintfulStoreId,
  PRINTFUL_API_BASE_URL,
} from '../merch.helpers';
import type {
  MerchProviderAdapter,
  MerchProviderConnectionContext,
  MerchProviderListProductsOptions,
  MerchProviderStoreSummary,
} from './merch-provider.interface';

const PRINTFUL_REQUEST_TIMEOUT_MS = 5_000;

interface PrintfulResponse<T> {
  code: number;
  result: T;
  paging?: {
    total: number;
    offset: number;
    limit: number;
  };
}

interface PrintfulStoreSummaryNode {
  id: number | string;
  name?: string | null;
}

interface PrintfulSyncProductNode {
  id: number | string;
  external_id?: string | null;
  name?: string | null;
  thumbnail_url?: string | null;
  variants?: number | null;
  synced?: number | null;
  is_ignored?: boolean | null;
}

interface PrintfulSyncVariantNode {
  id?: number | string;
  retail_price?: string | number | null;
  currency?: string | null;
  files?: Array<{
    preview_url?: string | null;
    thumbnail_url?: string | null;
    url?: string | null;
  }> | null;
}

interface PrintfulSyncProductDetailNode {
  sync_product?: PrintfulSyncProductNode | null;
  sync_variants?: PrintfulSyncVariantNode[] | null;
  id?: number | string;
  name?: string | null;
  thumbnail_url?: string | null;
}

@Injectable()
export class PrintfulProviderService implements MerchProviderAdapter {
  readonly provider = 'printful' as const;

  async validateConnection(apiToken: string): Promise<MerchProviderStoreSummary> {
    const stores = (await this.request<PrintfulStoreSummaryNode[]>('/stores', apiToken)) ?? [];
    const primaryStore = stores[0] ?? null;

    if (!primaryStore) {
      throw new BadRequestException('Printful token is valid, but no stores are available');
    }

    return {
      storeId: String(primaryStore.id),
      storeName: primaryStore.name?.trim() || 'Printful store',
    };
  }

  async listProducts(
    connection: MerchProviderConnectionContext,
    options?: MerchProviderListProductsOptions,
  ): Promise<SmartMerchProduct[]> {
    const limit = normalizeMerchPreviewLimit(options?.limit);
    const products =
      (await this.request<PrintfulSyncProductNode[]>(
        `/sync/products?limit=${limit}`,
        connection.apiToken,
        { storeId: connection.storeId },
      )) ?? [];

    return products.map((product) => this.mapSyncProductSummary(product));
  }

  async getProductsByIds(
    connection: MerchProviderConnectionContext,
    ids: string[],
  ): Promise<SmartMerchProduct[]> {
    const uniqueIds = [...new Set(ids.map((id) => id.trim()).filter(Boolean))];
    const responses = await Promise.all(
      uniqueIds.map((id) =>
        this.request<PrintfulSyncProductDetailNode>(
          `/store/products/${encodeURIComponent(id)}`,
          connection.apiToken,
          {
            allowNotFound: true,
            storeId: connection.storeId,
          },
        ),
      ),
    );

    return responses
      .filter((product): product is PrintfulSyncProductDetailNode => Boolean(product))
      .map((product) => this.mapSyncProductDetail(product));
  }

  private mapSyncProductSummary(product: PrintfulSyncProductNode): SmartMerchProduct {
    const title = product.name?.trim() || 'Untitled merch product';
    const availableCount = typeof product.synced === 'number' ? product.synced : product.variants;

    return {
      id: String(product.id),
      provider: 'printful',
      title,
      description: null,
      imageUrl: product.thumbnail_url?.trim() || null,
      productUrl: null,
      priceAmount: null,
      currencyCode: null,
      availableForSale: Boolean(!product.is_ignored && (availableCount ?? 1) > 0),
    };
  }

  private mapSyncProductDetail(product: PrintfulSyncProductDetailNode): SmartMerchProduct {
    const syncProduct = product.sync_product ?? null;
    const variants = product.sync_variants ?? [];
    const primaryVariant =
      variants.find((variant) => normalizePriceAmount(variant.retail_price)) ?? variants[0];
    const imageUrl =
      syncProduct?.thumbnail_url?.trim() ||
      product.thumbnail_url?.trim() ||
      primaryVariant?.files?.find((file) => file.preview_url || file.thumbnail_url || file.url)
        ?.preview_url ||
      primaryVariant?.files?.find((file) => file.preview_url || file.thumbnail_url || file.url)
        ?.thumbnail_url ||
      primaryVariant?.files?.find((file) => file.preview_url || file.thumbnail_url || file.url)
        ?.url ||
      null;

    const summaryNode: PrintfulSyncProductNode = {
      id: syncProduct?.id ?? product.id ?? 'unknown',
      name: syncProduct?.name ?? product.name,
      thumbnail_url: syncProduct?.thumbnail_url ?? product.thumbnail_url,
      synced: syncProduct?.synced,
      variants: syncProduct?.variants,
      is_ignored: syncProduct?.is_ignored,
    };

    return {
      ...this.mapSyncProductSummary(summaryNode),
      imageUrl,
      priceAmount: normalizePriceAmount(primaryVariant?.retail_price),
      currencyCode: primaryVariant?.currency?.trim() || null,
    };
  }

  private async request<T>(
    path: string,
    apiToken: string,
    options?: { allowNotFound?: boolean; storeId?: string | null },
  ): Promise<T | null> {
    const headers: Record<string, string> = {
      Accept: 'application/json',
      Authorization: `Bearer ${apiToken}`,
    };

    const storeId = normalizePrintfulStoreId(options?.storeId);
    if (storeId) {
      headers['X-PF-Store-Id'] = storeId;
    }

    let response: Response;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), PRINTFUL_REQUEST_TIMEOUT_MS);
    try {
      response = await fetch(`${PRINTFUL_API_BASE_URL}${path}`, {
        method: 'GET',
        headers,
        signal: controller.signal,
      });
    } catch (error) {
      if (controller.signal.aborted) {
        throw new ServiceUnavailableException('Printful timed out');
      }
      console.error('[merch/printful] Provider request failed', error);
      throw new ServiceUnavailableException('Could not reach Printful right now');
    } finally {
      clearTimeout(timeout);
    }

    let payload: PrintfulResponse<T> | null = null;
    try {
      payload = (await response.json()) as PrintfulResponse<T>;
    } catch {
      payload = null;
    }

    if (response.status === 404 && options?.allowNotFound) {
      return null;
    }

    if (!response.ok) {
      const message =
        typeof (payload as { result?: unknown } | null)?.result === 'string'
          ? String((payload as { result?: unknown }).result)
          : 'Printful connection failed';

      if (response.status === 401 || response.status === 403 || response.status === 404) {
        throw new BadRequestException(message);
      }

      throw new ServiceUnavailableException(message);
    }

    if (!payload?.result) {
      throw new ServiceUnavailableException('Printful returned an empty response');
    }

    return payload.result;
  }
}
