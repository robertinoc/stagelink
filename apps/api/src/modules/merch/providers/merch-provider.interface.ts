import type { SmartMerchProduct, SmartMerchProvider } from '@stagelink/types';

export interface MerchProviderConnectionContext {
  apiToken: string;
  storeId?: string | null;
}

export interface MerchProviderStoreSummary {
  storeId: string | null;
  storeName: string | null;
}

export interface MerchProviderListProductsOptions {
  limit?: number;
}

export interface MerchProviderAdapter {
  readonly provider: SmartMerchProvider;
  validateConnection(apiToken: string): Promise<MerchProviderStoreSummary>;
  listProducts(
    connection: MerchProviderConnectionContext,
    options?: MerchProviderListProductsOptions,
  ): Promise<SmartMerchProduct[]>;
  getProductsByIds(
    connection: MerchProviderConnectionContext,
    ids: string[],
  ): Promise<SmartMerchProduct[]>;
}
