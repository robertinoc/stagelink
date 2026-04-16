import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Prisma, ShopifySelectionMode } from '@prisma/client';
import type {
  ShopifyConnection,
  ShopifyConnectionValidationResult,
  ShopifySelectionMode as SharedShopifySelectionMode,
  ShopifyStoreProduct,
} from '@stagelink/types';
import { PrismaService } from '../../lib/prisma.service';
import { MembershipService } from '../membership/membership.service';
import { AuditService } from '../audit/audit.service';
import { BillingEntitlementsService } from '../billing/billing-entitlements.service';
import { UpdateShopifyConnectionDto, ValidateShopifyConnectionDto } from './dto';
import {
  normalizeProductHandles,
  normalizeShopifyHandle,
  normalizeShopifyStoreDomain,
  resolvePreviewLimit,
  SHOPIFY_DEFAULT_PREVIEW_LIMIT,
  SHOPIFY_STOREFRONT_API_VERSION,
} from './shopify.helpers';

interface StorefrontProductNode {
  id: string;
  title: string;
  handle: string;
  availableForSale: boolean;
  onlineStoreUrl: string | null;
  featuredImage: {
    url: string;
    altText: string | null;
  } | null;
  priceRange: {
    minVariantPrice: {
      amount: string;
      currencyCode: string;
    };
  };
}

interface ShopifySelectionPreview {
  collectionTitle: string | null;
  products: ShopifyStoreProduct[];
}

interface CachedShopifySelectionPreview {
  preview: ShopifySelectionPreview;
  expiresAt: number;
}

const SHOPIFY_SELECTION_CACHE_TTL_MS = 60_000;

@Injectable()
export class ShopifyService {
  private readonly selectionPreviewCache = new Map<string, CachedShopifySelectionPreview>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly membershipService: MembershipService,
    private readonly auditService: AuditService,
    private readonly billingEntitlementsService: BillingEntitlementsService,
  ) {}

  async getConnection(artistId: string, userId: string): Promise<ShopifyConnection> {
    await this.membershipService.validateAccess(userId, artistId, 'read');
    await this.billingEntitlementsService.assertFeatureAccess(artistId, 'shopify_integration');

    const connection = await this.prisma.shopifyConnection.findUnique({
      where: { artistId },
    });

    if (!connection) {
      return this.buildEmptyConnection(artistId);
    }

    const preview = await this.getSelectionPreviewSafe(
      artistId,
      connection,
      SHOPIFY_DEFAULT_PREVIEW_LIMIT,
    );
    return this.mapConnection(connection, preview);
  }

  async validateConnection(
    artistId: string,
    dto: ValidateShopifyConnectionDto,
    userId: string,
  ): Promise<ShopifyConnectionValidationResult> {
    await this.membershipService.validateAccess(userId, artistId, 'write');
    await this.billingEntitlementsService.assertFeatureAccess(artistId, 'shopify_integration');

    const storeDomain = normalizeShopifyStoreDomain(dto.storeDomain);
    const storefrontToken = dto.storefrontToken.trim();
    if (!storefrontToken) {
      throw new BadRequestException('Storefront token is required');
    }

    const shop = await this.fetchShopSummary(storeDomain, storefrontToken);
    return {
      ok: true,
      storeName: shop.name,
      message: `Connected to ${shop.name}`,
    };
  }

  async updateConnection(
    artistId: string,
    dto: UpdateShopifyConnectionDto,
    userId: string,
    ipAddress?: string,
  ): Promise<ShopifyConnection> {
    await this.membershipService.validateAccess(userId, artistId, 'write');
    await this.billingEntitlementsService.assertFeatureAccess(artistId, 'shopify_integration');

    const existing = await this.prisma.shopifyConnection.findUnique({
      where: { artistId },
    });

    const storeDomain = normalizeShopifyStoreDomain(dto.storeDomain);
    const selectionMode = dto.selectionMode as ShopifySelectionMode;
    const storefrontToken = dto.storefrontToken?.trim() || existing?.storefrontToken;

    if (!storefrontToken) {
      throw new BadRequestException('Storefront token is required');
    }

    const collectionHandle =
      selectionMode === 'collection'
        ? normalizeShopifyHandle(dto.collectionHandle ?? '', 'Collection handle')
        : null;
    const productHandles =
      selectionMode === 'products' ? normalizeProductHandles(dto.productHandles ?? []) : [];

    const shop = await this.fetchShopSummary(storeDomain, storefrontToken);
    const preview = await this.fetchSelectionPreview({
      storeDomain,
      storefrontToken,
      selectionMode,
      collectionHandle,
      productHandles,
      maxItems: SHOPIFY_DEFAULT_PREVIEW_LIMIT,
    });

    if (selectionMode === 'collection' && !preview.collectionTitle) {
      throw new BadRequestException('Collection handle was not found in Shopify');
    }

    if (selectionMode === 'products' && preview.products.length === 0) {
      throw new BadRequestException('None of the selected product handles were found in Shopify');
    }

    const saved = await this.prisma.shopifyConnection.upsert({
      where: { artistId },
      update: {
        storeDomain,
        storefrontToken,
        storeName: shop.name,
        isConnected: true,
        selectionMode,
        collectionHandle,
        productHandles: productHandles as unknown as Prisma.InputJsonValue,
      },
      create: {
        artistId,
        storeDomain,
        storefrontToken,
        storeName: shop.name,
        isConnected: true,
        selectionMode,
        collectionHandle,
        productHandles: productHandles as unknown as Prisma.InputJsonValue,
      },
    });

    this.auditService.log({
      actorId: userId,
      action: existing ? 'shopify_connection.update' : 'shopify_connection.create',
      entityType: 'shopify_connection',
      entityId: saved.id,
      metadata: {
        artistId,
        selectionMode,
        storeDomain,
        collectionHandle,
        productHandlesCount: productHandles.length,
      },
      ipAddress,
    });

    this.clearSelectionPreviewCache(artistId);

    return this.mapConnection(saved, preview);
  }

  async getPublicStoreSelection(
    artistId: string,
    options?: { maxItems?: number },
  ): Promise<ShopifySelectionPreview> {
    const hasFeature = await this.billingEntitlementsService.hasFeatureAccess(
      artistId,
      'shopify_integration',
    );
    if (!hasFeature) {
      return { collectionTitle: null, products: [] };
    }

    const connection = await this.prisma.shopifyConnection.findUnique({
      where: { artistId },
    });

    if (!connection || !connection.isConnected) {
      return { collectionTitle: null, products: [] };
    }

    return this.getSelectionPreviewSafe(
      artistId,
      connection,
      options?.maxItems ?? SHOPIFY_DEFAULT_PREVIEW_LIMIT,
    );
  }

  private buildEmptyConnection(artistId: string): ShopifyConnection {
    const now = new Date().toISOString();
    return {
      artistId,
      storeDomain: null,
      storeName: null,
      isConnected: false,
      hasStorefrontToken: false,
      selectionMode: 'collection',
      collectionHandle: null,
      productHandles: [],
      previewProducts: [],
      createdAt: now,
      updatedAt: now,
    };
  }

  private mapConnection(
    connection: {
      artistId: string;
      storeDomain: string;
      storeName: string | null;
      isConnected: boolean;
      selectionMode: ShopifySelectionMode;
      collectionHandle: string | null;
      productHandles: Prisma.JsonValue;
      createdAt: Date;
      updatedAt: Date;
      storefrontToken: string;
    },
    preview: ShopifySelectionPreview,
  ): ShopifyConnection {
    return {
      artistId: connection.artistId,
      storeDomain: connection.storeDomain,
      storeName: connection.storeName,
      isConnected: connection.isConnected,
      hasStorefrontToken: Boolean(connection.storefrontToken),
      selectionMode: connection.selectionMode as SharedShopifySelectionMode,
      collectionHandle: connection.collectionHandle,
      productHandles: this.readProductHandles(connection.productHandles),
      previewProducts: preview.products,
      createdAt: connection.createdAt.toISOString(),
      updatedAt: connection.updatedAt.toISOString(),
    };
  }

  private async getSelectionPreviewSafe(
    artistId: string,
    connection: {
      storeDomain: string;
      storefrontToken: string;
      selectionMode: ShopifySelectionMode;
      collectionHandle: string | null;
      productHandles: Prisma.JsonValue;
    },
    maxItems: number,
  ): Promise<ShopifySelectionPreview> {
    const cacheKey = this.buildSelectionPreviewCacheKey(artistId, connection, maxItems);
    const cachedPreview = this.readSelectionPreviewCache(cacheKey);
    if (cachedPreview && cachedPreview.expiresAt > Date.now()) {
      return cachedPreview.preview;
    }

    try {
      const preview = await this.fetchSelectionPreview({
        storeDomain: connection.storeDomain,
        storefrontToken: connection.storefrontToken,
        selectionMode: connection.selectionMode,
        collectionHandle: connection.collectionHandle,
        productHandles: this.readProductHandles(connection.productHandles),
        maxItems,
      });
      this.selectionPreviewCache.set(cacheKey, {
        preview,
        expiresAt: Date.now() + SHOPIFY_SELECTION_CACHE_TTL_MS,
      });
      return preview;
    } catch (error) {
      console.error('[shopify] Failed to fetch selection preview', error);
      if (cachedPreview) {
        return cachedPreview.preview;
      }
      return { collectionTitle: null, products: [] };
    }
  }

  private buildSelectionPreviewCacheKey(
    artistId: string,
    connection: {
      storeDomain: string;
      selectionMode: ShopifySelectionMode;
      collectionHandle: string | null;
      productHandles: Prisma.JsonValue;
    },
    maxItems: number,
  ): string {
    return JSON.stringify({
      artistId,
      storeDomain: connection.storeDomain,
      selectionMode: connection.selectionMode,
      collectionHandle: connection.collectionHandle,
      productHandles: this.readProductHandles(connection.productHandles),
      maxItems,
    });
  }

  private readSelectionPreviewCache(cacheKey: string): CachedShopifySelectionPreview | null {
    return this.selectionPreviewCache.get(cacheKey) ?? null;
  }

  private clearSelectionPreviewCache(artistId: string): void {
    for (const key of this.selectionPreviewCache.keys()) {
      if (key.includes(`"artistId":"${artistId}"`)) {
        this.selectionPreviewCache.delete(key);
      }
    }
  }

  private readProductHandles(jsonValue: Prisma.JsonValue): string[] {
    if (!Array.isArray(jsonValue)) return [];
    return jsonValue.filter((entry): entry is string => typeof entry === 'string');
  }

  private async fetchShopSummary(storeDomain: string, storefrontToken: string) {
    const data = await this.storefrontRequest<{ shop: { name: string } }>(
      storeDomain,
      storefrontToken,
      `
        query ValidateStorefrontConnection {
          shop {
            name
          }
        }
      `,
    );

    if (!data.shop?.name) {
      throw new ServiceUnavailableException('Shopify did not return store details');
    }

    return data.shop;
  }

  private async fetchSelectionPreview(params: {
    storeDomain: string;
    storefrontToken: string;
    selectionMode: ShopifySelectionMode;
    collectionHandle: string | null;
    productHandles: string[];
    maxItems: number;
  }): Promise<ShopifySelectionPreview> {
    const maxItems = resolvePreviewLimit(params.maxItems);

    if (params.selectionMode === 'collection') {
      if (!params.collectionHandle) {
        throw new BadRequestException('Collection handle is required');
      }

      const data = await this.storefrontRequest<{
        collection: {
          title: string;
          products: {
            nodes: StorefrontProductNode[];
          };
        } | null;
      }>(
        params.storeDomain,
        params.storefrontToken,
        `
          query ShopifyCollectionPreview($handle: String!, $first: Int!) {
            collection(handle: $handle) {
              title
              products(first: $first) {
                nodes {
                  id
                  title
                  handle
                  availableForSale
                  onlineStoreUrl
                  featuredImage {
                    url
                    altText
                  }
                  priceRange {
                    minVariantPrice {
                      amount
                      currencyCode
                    }
                  }
                }
              }
            }
          }
        `,
        {
          handle: params.collectionHandle,
          first: maxItems,
        },
      );

      return {
        collectionTitle: data.collection?.title ?? null,
        products: (data.collection?.products.nodes ?? []).map((product) =>
          this.mapStorefrontProduct(product, params.storeDomain),
        ),
      };
    }

    if (params.productHandles.length === 0) {
      throw new BadRequestException('At least one product handle is required');
    }

    const handles = params.productHandles.slice(0, maxItems);
    const aliases = handles
      .map(
        (handle, index) => `
          product_${index}: product(handle: "${handle}") {
            id
            title
            handle
            availableForSale
            onlineStoreUrl
            featuredImage {
              url
              altText
            }
            priceRange {
              minVariantPrice {
                amount
                currencyCode
              }
            }
          }
        `,
      )
      .join('\n');

    const data = await this.storefrontRequest<Record<string, StorefrontProductNode | null>>(
      params.storeDomain,
      params.storefrontToken,
      `query ShopifyProductsPreview { ${aliases} }`,
    );

    return {
      collectionTitle: null,
      products: handles
        .map((_, index) => data[`product_${index}`] ?? null)
        .filter((product): product is StorefrontProductNode => Boolean(product))
        .map((product) => this.mapStorefrontProduct(product, params.storeDomain)),
    };
  }

  private mapStorefrontProduct(
    product: StorefrontProductNode,
    storeDomain: string,
  ): ShopifyStoreProduct {
    return {
      id: product.id,
      title: product.title,
      handle: product.handle,
      imageUrl: product.featuredImage?.url ?? null,
      productUrl: product.onlineStoreUrl ?? `https://${storeDomain}/products/${product.handle}`,
      priceAmount: product.priceRange.minVariantPrice.amount,
      currencyCode: product.priceRange.minVariantPrice.currencyCode,
      availableForSale: product.availableForSale,
    };
  }

  private async storefrontRequest<T>(
    storeDomain: string,
    storefrontToken: string,
    query: string,
    variables?: Record<string, unknown>,
  ): Promise<T> {
    const endpoint = `https://${storeDomain}/api/${SHOPIFY_STOREFRONT_API_VERSION}/graphql.json`;

    let response: Response;
    try {
      response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'X-Shopify-Storefront-Access-Token': storefrontToken,
        },
        body: JSON.stringify({ query, variables }),
      });
    } catch (error) {
      console.error('[shopify] Storefront API request failed', error);
      throw new ServiceUnavailableException('Could not reach Shopify right now');
    }

    let payload: { data?: T; errors?: Array<{ message: string }> } | null = null;
    try {
      payload = (await response.json()) as { data?: T; errors?: Array<{ message: string }> };
    } catch {
      payload = null;
    }

    if (!response.ok) {
      const message = payload?.errors?.[0]?.message ?? 'Shopify connection failed';
      if (response.status === 401 || response.status === 403 || response.status === 404) {
        throw new BadRequestException(message);
      }
      throw new ServiceUnavailableException(message);
    }

    if (payload?.errors?.length) {
      throw new BadRequestException(payload.errors[0]?.message ?? 'Shopify returned an error');
    }

    if (!payload?.data) {
      throw new ServiceUnavailableException('Shopify returned an empty response');
    }

    return payload.data;
  }
}
