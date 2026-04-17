export const SMART_MERCH_PROVIDERS = ['printful', 'printify'] as const;
export type SmartMerchProvider = (typeof SMART_MERCH_PROVIDERS)[number];

export const SMART_MERCH_SOURCE_MODES = ['selected_products'] as const;
export type SmartMerchSourceMode = (typeof SMART_MERCH_SOURCE_MODES)[number];

export const SMART_MERCH_DISPLAY_MODES = ['grid', 'list'] as const;
export type SmartMerchDisplayMode = (typeof SMART_MERCH_DISPLAY_MODES)[number];

export interface SmartMerchProductSelection {
  productId: string;
  purchaseUrl: string;
}

export interface SmartMerchProduct {
  id: string;
  provider: SmartMerchProvider;
  title: string;
  description: string | null;
  imageUrl: string | null;
  productUrl: string | null;
  priceAmount: string | null;
  currencyCode: string | null;
  availableForSale: boolean;
}

export interface MerchProviderConnection {
  artistId: string;
  provider: SmartMerchProvider;
  storeId: string | null;
  storeName: string | null;
  isConnected: boolean;
  hasApiToken: boolean;
  previewProducts: SmartMerchProduct[];
  createdAt: string;
  updatedAt: string;
}

export interface MerchConnectionValidationResult {
  ok: boolean;
  provider: SmartMerchProvider;
  storeId: string | null;
  storeName: string | null;
  message: string;
}

export interface ValidateMerchConnectionPayload {
  provider: SmartMerchProvider;
  apiToken: string;
}

export interface UpdateMerchConnectionPayload {
  provider: SmartMerchProvider;
  apiToken?: string;
  storeId?: string | null;
}
