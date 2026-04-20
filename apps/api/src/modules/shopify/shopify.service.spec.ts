import { ShopifySelectionMode } from '@prisma/client';
import { encryptSecret } from '../../common/utils/secret-encryption';
import { ShopifyService } from './shopify.service';

describe('ShopifyService', () => {
  const previousKey = process.env['SECRETS_ENCRYPTION_KEY'];

  interface PrismaMock {
    shopifyConnection: {
      findUnique: jest.Mock;
      upsert: jest.Mock;
    };
  }

  function createService() {
    const prisma: PrismaMock = {
      shopifyConnection: {
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

    const service = new ShopifyService(
      prisma as never,
      membershipService as never,
      auditService as never,
      billingEntitlementsService as never,
    );

    return {
      service,
      prisma,
      membershipService,
      auditService,
      billingEntitlementsService,
    };
  }

  function createGraphqlResponse(data: unknown): Response {
    return {
      ok: true,
      json: jest.fn().mockResolvedValue({ data }),
    } as unknown as Response;
  }

  beforeEach(() => {
    process.env['SECRETS_ENCRYPTION_KEY'] = 'test-encryption-key-for-stagelink';
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-04-16T15:00:00.000Z'));
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

  it('returns an empty selection when the artist lacks the Shopify feature', async () => {
    const { service, prisma, billingEntitlementsService } = createService();
    billingEntitlementsService.hasFeatureAccess.mockResolvedValue(false);

    const result = await service.getPublicStoreSelection('artist_free');

    expect(result).toEqual({ collectionTitle: null, products: [] });
    expect(prisma.shopifyConnection.findUnique).not.toHaveBeenCalled();
  });

  it('caches public selection previews and falls back to stale cache on transient Shopify failures', async () => {
    const { service, prisma, billingEntitlementsService } = createService();
    billingEntitlementsService.hasFeatureAccess.mockResolvedValue(true);
    prisma.shopifyConnection.findUnique.mockResolvedValue({
      artistId: 'artist_123',
      isConnected: true,
      storeDomain: 'artist-store.myshopify.com',
      storefrontToken: encryptSecret('shpst_test'),
      selectionMode: ShopifySelectionMode.collection,
      collectionHandle: 'merch',
      productHandles: [],
    });

    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce(
        createGraphqlResponse({
          collection: {
            title: 'Merch',
            products: {
              nodes: [
                {
                  id: 'gid://shopify/Product/1',
                  title: 'Black Hoodie',
                  handle: 'black-hoodie',
                  availableForSale: true,
                  onlineStoreUrl: null,
                  featuredImage: {
                    url: 'https://cdn.shopify.com/hoodie.jpg',
                    altText: 'Black Hoodie',
                  },
                  priceRange: {
                    minVariantPrice: {
                      amount: '49.00',
                      currencyCode: 'USD',
                    },
                  },
                },
              ],
            },
          },
        }),
      )
      .mockRejectedValueOnce(new Error('Shopify timeout'));

    global.fetch = fetchMock as unknown as typeof fetch;
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const first = await service.getPublicStoreSelection('artist_123', { maxItems: 4 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(first.collectionTitle).toBe('Merch');
    expect(first.products[0]?.productUrl).toBe(
      'https://artist-store.myshopify.com/products/black-hoodie',
    );

    const second = await service.getPublicStoreSelection('artist_123', { maxItems: 4 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(second).toEqual(first);

    jest.advanceTimersByTime(61_000);
    const staleFallback = await service.getPublicStoreSelection('artist_123', { maxItems: 4 });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(staleFallback).toEqual(first);
    expect(consoleErrorSpy).toHaveBeenCalled();
  });
});
