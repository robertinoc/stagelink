import { MerchProvider } from '@prisma/client';
import { encryptSecret } from '../../common/utils/secret-encryption';
import { MerchService } from './merch.service';

describe('MerchService', () => {
  const previousKey = process.env['SECRETS_ENCRYPTION_KEY'];

  interface PrismaMock {
    merchProviderConnection: {
      findUnique: jest.Mock;
      upsert: jest.Mock;
    };
  }

  function createService() {
    const prisma: PrismaMock = {
      merchProviderConnection: {
        findUnique: jest.fn(),
        upsert: jest.fn(),
      },
    };

    const membershipService = {
      validateAccess: jest.fn(),
    };

    const auditService = {
      log: jest.fn(),
    };

    const billingEntitlementsService = {
      assertFeatureAccess: jest.fn(),
      hasFeatureAccess: jest.fn(),
    };

    const printfulProvider = {
      provider: 'printful' as const,
      validateConnection: jest.fn(),
      listProducts: jest.fn(),
      getProductsByIds: jest.fn(),
    };

    const service = new MerchService(
      prisma as never,
      membershipService as never,
      auditService as never,
      billingEntitlementsService as never,
      printfulProvider as never,
    );

    return {
      service,
      prisma,
      membershipService,
      auditService,
      billingEntitlementsService,
      printfulProvider,
    };
  }

  beforeEach(() => {
    process.env['SECRETS_ENCRYPTION_KEY'] = 'test-encryption-key-for-stagelink';
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-04-17T15:00:00.000Z'));
    jest.restoreAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  afterAll(() => {
    if (previousKey === undefined) {
      delete process.env['SECRETS_ENCRYPTION_KEY'];
    } else {
      process.env['SECRETS_ENCRYPTION_KEY'] = previousKey;
    }
  });

  it('returns an empty public selection when the artist lacks the smart_merch feature', async () => {
    const { service, prisma, billingEntitlementsService } = createService();
    billingEntitlementsService.hasFeatureAccess.mockResolvedValue(false);

    const result = await service.getPublicProducts('artist_free', 'printful', [
      { productId: '1', purchaseUrl: 'https://shop.example.com/products/1' },
    ]);

    expect(result).toEqual([]);
    expect(prisma.merchProviderConnection.findUnique).not.toHaveBeenCalled();
  });

  it('caches public product lookups and falls back to stale cache on transient provider failures', async () => {
    const { service, prisma, billingEntitlementsService, printfulProvider } = createService();
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    billingEntitlementsService.hasFeatureAccess.mockResolvedValue(true);
    prisma.merchProviderConnection.findUnique.mockResolvedValue({
      artistId: 'artist_123',
      provider: MerchProvider.printful,
      apiToken: encryptSecret('pf_test'),
      storeId: 'store_1',
      isConnected: true,
    });

    printfulProvider.getProductsByIds
      .mockResolvedValueOnce([
        {
          id: 'product_1',
          provider: 'printful',
          title: 'Oversized Tee',
          description: null,
          imageUrl: 'https://cdn.example.com/tee.jpg',
          productUrl: null,
          priceAmount: '24.00',
          currencyCode: 'USD',
          availableForSale: true,
        },
      ])
      .mockRejectedValueOnce(new Error('Printful timeout'));

    const first = await service.getPublicProducts(
      'artist_123',
      'printful',
      [{ productId: 'product_1', purchaseUrl: 'https://shop.example.com/products/tee' }],
      { maxItems: 4 },
    );

    expect(first[0]?.productUrl).toBe('https://shop.example.com/products/tee');
    expect(printfulProvider.getProductsByIds).toHaveBeenCalledTimes(1);

    const second = await service.getPublicProducts(
      'artist_123',
      'printful',
      [{ productId: 'product_1', purchaseUrl: 'https://shop.example.com/products/tee' }],
      { maxItems: 4 },
    );

    expect(second).toEqual(first);
    expect(printfulProvider.getProductsByIds).toHaveBeenCalledTimes(1);

    jest.advanceTimersByTime(61_000);

    const staleFallback = await service.getPublicProducts(
      'artist_123',
      'printful',
      [{ productId: 'product_1', purchaseUrl: 'https://shop.example.com/products/tee' }],
      { maxItems: 4 },
    );

    expect(staleFallback).toEqual(first);
    expect(printfulProvider.getProductsByIds).toHaveBeenCalledTimes(2);
    expect(consoleErrorSpy).toHaveBeenCalled();
  });

  it('rejects selected products that do not exist in the connected provider', async () => {
    const { service, prisma, billingEntitlementsService, printfulProvider } = createService();
    billingEntitlementsService.assertFeatureAccess.mockResolvedValue(undefined);
    prisma.merchProviderConnection.findUnique.mockResolvedValue({
      artistId: 'artist_123',
      provider: MerchProvider.printful,
      apiToken: encryptSecret('pf_test'),
      storeId: 'store_1',
      isConnected: true,
    });
    printfulProvider.getProductsByIds.mockResolvedValue([
      {
        id: 'product_1',
        provider: 'printful',
        title: 'Poster',
        description: null,
        imageUrl: null,
        productUrl: null,
        priceAmount: null,
        currencyCode: null,
        availableForSale: true,
      },
    ]);

    await expect(
      service.assertSelectedProductsValid('artist_123', 'printful', [
        { productId: 'product_1', purchaseUrl: 'https://shop.example.com/poster' },
        { productId: 'missing_product', purchaseUrl: 'https://shop.example.com/missing' },
      ]),
    ).rejects.toThrow('One or more selected merch products were not found');
  });
});
