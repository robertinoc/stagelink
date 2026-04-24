import { BadRequestException, Injectable, ServiceUnavailableException } from '@nestjs/common';
import { MerchProvider } from '@prisma/client';
import type {
  MerchConnectionValidationResult,
  MerchProviderConnection,
  SmartMerchProduct,
  SmartMerchProductSelection,
  SmartMerchProvider,
} from '@stagelink/types';
import { PrismaService } from '../../lib/prisma.service';
import { decryptSecretOrLegacy, encryptSecret } from '../../common/utils/secret-encryption';
import { AuditService } from '../audit/audit.service';
import { BillingEntitlementsService } from '../billing/billing-entitlements.service';
import { MembershipService } from '../membership/membership.service';
import {
  assertNonEmptyToken,
  normalizeMerchPreviewLimit,
  SMART_MERCH_CACHE_TTL_MS,
  SMART_MERCH_DEFAULT_PREVIEW_LIMIT,
} from './merch.helpers';
import { UpdateMerchConnectionDto, ValidateMerchConnectionDto } from './dto';
import { PrintfulProviderService } from './providers/printful.provider';
import type {
  MerchProviderAdapter,
  MerchProviderConnectionContext,
} from './providers/merch-provider.interface';

interface CachedMerchProducts {
  products: SmartMerchProduct[];
  expiresAt: number;
}

@Injectable()
export class MerchService {
  private readonly publicProductsCache = new Map<string, CachedMerchProducts>();
  private readonly productSelectionCache = new Map<string, CachedMerchProducts>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly membershipService: MembershipService,
    private readonly auditService: AuditService,
    private readonly billingEntitlementsService: BillingEntitlementsService,
    private readonly printfulProvider: PrintfulProviderService,
  ) {}

  async getConnection(artistId: string, userId: string): Promise<MerchProviderConnection> {
    await this.membershipService.validateAccess(userId, artistId, 'read');
    await this.billingEntitlementsService.assertFeatureAccess(artistId, 'smart_merch');

    const connection = await this.prisma.merchProviderConnection.findUnique({
      where: { artistId },
    });

    if (!connection) {
      return this.buildEmptyConnection(artistId);
    }

    const previewProducts = await this.getConnectionPreviewSafe(connection);
    return this.mapConnection(connection, previewProducts);
  }

  async validateConnection(
    artistId: string,
    dto: ValidateMerchConnectionDto,
    userId: string,
  ): Promise<MerchConnectionValidationResult> {
    await this.membershipService.validateAccess(userId, artistId, 'write');
    await this.billingEntitlementsService.assertFeatureAccess(artistId, 'smart_merch');

    const provider = this.resolveProvider(dto.provider);
    const apiToken = assertNonEmptyToken(dto.apiToken);
    const summary = await provider.validateConnection(apiToken);

    return {
      ok: true,
      provider: provider.provider,
      storeId: summary.storeId,
      storeName: summary.storeName,
      message: summary.storeName
        ? `Connected to ${summary.storeName}`
        : `Connected to ${provider.provider}`,
    };
  }

  async updateConnection(
    artistId: string,
    dto: UpdateMerchConnectionDto,
    userId: string,
    ipAddress?: string,
  ): Promise<MerchProviderConnection> {
    await this.membershipService.validateAccess(userId, artistId, 'write');
    await this.billingEntitlementsService.assertFeatureAccess(artistId, 'smart_merch');

    const existing = await this.prisma.merchProviderConnection.findUnique({
      where: { artistId },
    });

    const provider = this.resolveProvider(dto.provider);
    const apiToken = assertNonEmptyToken(dto.apiToken ?? decryptSecretOrLegacy(existing?.apiToken));
    const summary = await provider.validateConnection(apiToken);

    const saved = await this.prisma.merchProviderConnection.upsert({
      where: { artistId },
      update: {
        provider: provider.provider as MerchProvider,
        apiToken: encryptSecret(apiToken),
        storeId: dto.storeId?.trim() || summary.storeId,
        storeName: summary.storeName,
        isConnected: true,
      },
      create: {
        artistId,
        provider: provider.provider as MerchProvider,
        apiToken: encryptSecret(apiToken),
        storeId: dto.storeId?.trim() || summary.storeId,
        storeName: summary.storeName,
        isConnected: true,
      },
    });

    this.auditService.log({
      actorId: userId,
      action: existing ? 'merch_connection.update' : 'merch_connection.create',
      entityType: 'merch_connection',
      entityId: saved.id,
      metadata: {
        artistId,
        provider: saved.provider,
        storeId: saved.storeId,
        storeName: saved.storeName,
      },
      ipAddress,
    });

    this.clearCaches(artistId);

    const previewProducts = await this.getConnectionPreviewSafe(saved);
    return this.mapConnection(saved, previewProducts);
  }

  async disconnectConnection(
    artistId: string,
    userId: string,
    ipAddress?: string,
  ): Promise<MerchProviderConnection> {
    await this.membershipService.validateAccess(userId, artistId, 'write');
    await this.billingEntitlementsService.assertFeatureAccess(artistId, 'smart_merch');

    const existing = await this.prisma.merchProviderConnection.findUnique({
      where: { artistId },
    });

    if (!existing) {
      return this.buildEmptyConnection(artistId);
    }

    await this.prisma.merchProviderConnection.delete({
      where: { artistId },
    });

    this.auditService.log({
      actorId: userId,
      action: 'merch_connection.delete',
      entityType: 'merch_connection',
      entityId: existing.id,
      metadata: {
        artistId,
        provider: existing.provider,
        storeId: existing.storeId,
      },
      ipAddress,
    });

    this.clearCaches(artistId);

    return this.buildEmptyConnection(artistId);
  }

  async listAvailableProducts(
    artistId: string,
    userId: string,
    limit?: number,
  ): Promise<SmartMerchProduct[]> {
    await this.membershipService.validateAccess(userId, artistId, 'read');
    await this.billingEntitlementsService.assertFeatureAccess(artistId, 'smart_merch');

    const connection = await this.getRequiredConnection(artistId);
    const provider = this.resolveProvider(connection.provider);
    const normalizedLimit = normalizeMerchPreviewLimit(limit);

    try {
      return await provider.listProducts(this.toProviderConnection(connection), {
        limit: normalizedLimit,
      });
    } catch (error) {
      console.error('[merch] Failed to list provider products', error);
      throw new ServiceUnavailableException('Could not load merch products right now');
    }
  }

  async assertSelectedProductsValid(
    artistId: string,
    providerKey: SmartMerchProvider,
    selections: SmartMerchProductSelection[],
  ): Promise<void> {
    await this.billingEntitlementsService.assertFeatureAccess(artistId, 'smart_merch');

    if (selections.length === 0) {
      return;
    }

    const connection = await this.getRequiredConnection(artistId, providerKey);
    const provider = this.resolveProvider(providerKey);
    const requestedIds = [...new Set(selections.map((selection) => selection.productId))];
    const products = await provider.getProductsByIds(
      this.toProviderConnection(connection),
      requestedIds,
    );
    const foundIds = new Set(products.map((product) => product.id));

    const missingIds = requestedIds.filter((id) => !foundIds.has(id));
    if (missingIds.length > 0) {
      throw new BadRequestException('One or more selected merch products were not found');
    }
  }

  async getPublicProducts(
    artistId: string,
    providerKey: SmartMerchProvider,
    selections: SmartMerchProductSelection[],
    options?: { maxItems?: number },
  ): Promise<SmartMerchProduct[]> {
    if (selections.length === 0) {
      return [];
    }

    const hasFeature = await this.billingEntitlementsService.hasFeatureAccess(
      artistId,
      'smart_merch',
    );
    if (!hasFeature) {
      return [];
    }

    const connection = await this.prisma.merchProviderConnection.findUnique({
      where: { artistId },
    });
    if (!connection || !connection.isConnected || connection.provider !== providerKey) {
      return [];
    }

    const maxItems = normalizeMerchPreviewLimit(options?.maxItems);
    const limitedSelections = selections.slice(0, maxItems);
    const cacheKey = JSON.stringify({
      artistId,
      provider: providerKey,
      selections: limitedSelections,
      maxItems,
    });
    const cached = this.publicProductsCache.get(cacheKey) ?? null;
    if (cached && cached.expiresAt > Date.now()) {
      return cached.products;
    }

    try {
      const provider = this.resolveProvider(providerKey);
      const products = await provider.getProductsByIds(
        this.toProviderConnection(connection),
        limitedSelections.map((selection) => selection.productId),
      );
      const mergedProducts = limitedSelections.reduce<SmartMerchProduct[]>((acc, selection) => {
        const product = products.find((entry) => entry.id === selection.productId);
        if (!product) {
          return acc;
        }

        acc.push({
          ...product,
          productUrl: selection.purchaseUrl,
        });
        return acc;
      }, []);

      this.publicProductsCache.set(cacheKey, {
        products: mergedProducts,
        expiresAt: Date.now() + SMART_MERCH_CACHE_TTL_MS,
      });
      return mergedProducts;
    } catch (error) {
      console.error('[merch] Failed to resolve public merch products', error);
      if (cached) {
        return cached.products;
      }
      return [];
    }
  }

  private resolveProvider(provider: SmartMerchProvider): MerchProviderAdapter {
    switch (provider) {
      case 'printful':
        return this.printfulProvider;
      case 'printify':
        throw new BadRequestException('Printify is not implemented yet');
      default:
        throw new BadRequestException(`Unsupported merch provider: ${String(provider)}`);
    }
  }

  private buildEmptyConnection(artistId: string): MerchProviderConnection {
    const now = new Date().toISOString();
    return {
      artistId,
      provider: 'printful',
      storeId: null,
      storeName: null,
      isConnected: false,
      hasApiToken: false,
      previewProducts: [],
      createdAt: now,
      updatedAt: now,
    };
  }

  private mapConnection(
    connection: {
      artistId: string;
      provider: MerchProvider;
      storeId: string | null;
      storeName: string | null;
      isConnected: boolean;
      apiToken: string;
      createdAt: Date;
      updatedAt: Date;
    },
    previewProducts: SmartMerchProduct[],
  ): MerchProviderConnection {
    return {
      artistId: connection.artistId,
      provider: connection.provider as SmartMerchProvider,
      storeId: connection.storeId,
      storeName: connection.storeName,
      isConnected: connection.isConnected,
      hasApiToken: Boolean(connection.apiToken),
      previewProducts,
      createdAt: connection.createdAt.toISOString(),
      updatedAt: connection.updatedAt.toISOString(),
    };
  }

  private async getConnectionPreviewSafe(connection: {
    artistId: string;
    provider: MerchProvider;
    apiToken: string;
    storeId: string | null;
  }): Promise<SmartMerchProduct[]> {
    const cacheKey = JSON.stringify({
      artistId: connection.artistId,
      provider: connection.provider,
      storeId: connection.storeId,
      mode: 'connection_preview',
    });
    const cached = this.productSelectionCache.get(cacheKey) ?? null;
    if (cached && cached.expiresAt > Date.now()) {
      return cached.products;
    }

    try {
      const provider = this.resolveProvider(connection.provider as SmartMerchProvider);
      const products = await provider.listProducts(this.toProviderConnection(connection), {
        limit: SMART_MERCH_DEFAULT_PREVIEW_LIMIT,
      });
      this.productSelectionCache.set(cacheKey, {
        products,
        expiresAt: Date.now() + SMART_MERCH_CACHE_TTL_MS,
      });
      return products;
    } catch (error) {
      console.error('[merch] Failed to fetch connection preview', error);
      if (cached) {
        return cached.products;
      }
      return [];
    }
  }

  private async getRequiredConnection(
    artistId: string,
    provider?: SmartMerchProvider,
  ): Promise<{
    artistId: string;
    provider: MerchProvider;
    apiToken: string;
    storeId: string | null;
    isConnected: boolean;
  }> {
    const connection = await this.prisma.merchProviderConnection.findUnique({
      where: { artistId },
    });

    if (!connection || !connection.isConnected) {
      throw new BadRequestException('Configure your merch provider before using Smart Merch');
    }

    if (provider && connection.provider !== provider) {
      throw new BadRequestException(
        `Connected merch provider is ${connection.provider}, but block is configured for ${provider}`,
      );
    }

    return connection;
  }

  private toProviderConnection(connection: {
    apiToken: string;
    storeId: string | null;
  }): MerchProviderConnectionContext {
    return {
      apiToken: decryptSecretOrLegacy(connection.apiToken),
      storeId: connection.storeId,
    };
  }

  private clearCaches(artistId: string): void {
    for (const [key] of this.publicProductsCache) {
      if (key.includes(`"artistId":"${artistId}"`)) {
        this.publicProductsCache.delete(key);
      }
    }

    for (const [key] of this.productSelectionCache) {
      if (key.includes(`"artistId":"${artistId}"`)) {
        this.productSelectionCache.delete(key);
      }
    }
  }
}
