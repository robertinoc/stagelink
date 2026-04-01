import { AnalyticsEnvironment } from '@prisma/client';
import { AnalyticsService } from './analytics.service';

describe('AnalyticsService', () => {
  function createService() {
    const prisma = {
      analyticsEvent: {
        count: jest.fn().mockResolvedValue(0),
        groupBy: jest.fn().mockResolvedValue([]),
      },
    };

    const billingEntitlementsService = {
      assertFeatureAccess: jest.fn().mockResolvedValue(undefined),
    };

    const service = new AnalyticsService(prisma as never, billingEntitlementsService as never);

    return { service, prisma, billingEntitlementsService };
  }

  it('requires analytics_pro for the 365d range', async () => {
    const { service, billingEntitlementsService } = createService();

    await service.getOverview('artist_123', '365d');

    expect(billingEntitlementsService.assertFeatureAccess).toHaveBeenCalledWith(
      'artist_123',
      'analytics_pro',
    );
  });

  it('does not require analytics_pro for standard ranges', async () => {
    const { service, billingEntitlementsService, prisma } = createService();

    await service.getOverview('artist_123', '30d');

    expect(billingEntitlementsService.assertFeatureAccess).not.toHaveBeenCalled();
    expect(prisma.analyticsEvent.count).toHaveBeenCalledWith({
      where: expect.objectContaining({
        artistId: 'artist_123',
        eventType: 'page_view',
        isBotSuspected: false,
        isQa: false,
        environment: AnalyticsEnvironment.production,
      }),
    });
  });
});
