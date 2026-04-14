export const SHOPIFY_SELECTION_MODES = ['collection', 'products'] as const;
export type ShopifySelectionMode = (typeof SHOPIFY_SELECTION_MODES)[number];

export interface ShopifyStoreProduct {
  id: string;
  title: string;
  handle: string;
  imageUrl: string | null;
  productUrl: string | null;
  priceAmount: string;
  currencyCode: string;
  availableForSale: boolean;
}

export interface ShopifyConnection {
  artistId: string;
  storeDomain: string | null;
  storeName: string | null;
  isConnected: boolean;
  hasStorefrontToken: boolean;
  selectionMode: ShopifySelectionMode;
  collectionHandle: string | null;
  productHandles: string[];
  previewProducts: ShopifyStoreProduct[];
  createdAt: string;
  updatedAt: string;
}

export interface ShopifyConnectionValidationResult {
  ok: boolean;
  storeName: string | null;
  message: string;
}

export interface ValidateShopifyConnectionPayload {
  storeDomain: string;
  storefrontToken: string;
}

export interface UpdateShopifyConnectionPayload {
  storeDomain: string;
  storefrontToken?: string;
  selectionMode: ShopifySelectionMode;
  collectionHandle?: string | null;
  productHandles?: string[];
}
