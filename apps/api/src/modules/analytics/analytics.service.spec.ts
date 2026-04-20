import { AnalyticsEnvironment } from '@prisma/client';
import { AnalyticsService } from './analytics.service';

describe('AnalyticsService', () => {
  function createService() {
    const prisma = {
      analyticsEvent: {
        count: jest.fn().mockResolvedValue(0),
        groupBy: jest.fn().mockResolvedValue([]),
      },
      smartLink: {
        findMany: jest.fn().mockResolvedValue([]),
      },
      block: {
        findMany: jest.fn().mockResolvedValue([]),
      },
      $queryRaw: jest.fn().mockResolvedValue([]),
    };

    const billingEntitlementsService = {
      assertFeatureAccess: jest.fn().mockResolvedValue(undefined),
    };

    const service = new AnalyticsService(prisma as never, billingEntitlementsService as never);

    return { service, prisma, billingEntitlementsService };
  }

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-04-08T12:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('requires analytics_pro for the 365d overview range', async () => {
    const { service, billingEntitlementsService } = createService();

    await service.getOverview('artist_123', '365d');

    expect(billingEntitlementsService.assertFeatureAccess).toHaveBeenCalledWith(
      'artist_123',
      'analytics_pro',
    );
  });

  it('does not require analytics_pro for standard overview ranges', async () => {
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

  it('requires analytics_pro for advanced trends and smart link performance', async () => {
    const { service, billingEntitlementsService } = createService();

    await service.getProTrends('artist_123', '30d');
    await service.getSmartLinkPerformance('artist_123', '30d');

    expect(billingEntitlementsService.assertFeatureAccess).toHaveBeenNthCalledWith(
      1,
      'artist_123',
      'analytics_pro',
    );
    expect(billingEntitlementsService.assertFeatureAccess).toHaveBeenNthCalledWith(
      2,
      'artist_123',
      'analytics_pro',
    );
  });

  it('requires advanced_fan_insights and keeps fan capture rate zero-safe', async () => {
    const { service, billingEntitlementsService, prisma } = createService();

    prisma.analyticsEvent.count
      .mockResolvedValueOnce(0) // page views
      .mockResolvedValueOnce(0); // fan captures

    const result = await service.getFanInsights('artist_123', '30d');

    expect(billingEntitlementsService.assertFeatureAccess).toHaveBeenCalledWith(
      'artist_123',
      'advanced_fan_insights',
    );
    expect(result.summary.fanCaptureRate).toBe(0);
    expect(result.notes.captureRateFormula).toBe('fan_capture_submit / page_view');
    expect(result.notes.piiIncluded).toBe(false);
  });

  it('fills missing days in the trends response', async () => {
    const { service, prisma } = createService();
    const activeDay = new Date('2026-04-06T00:00:00.000Z');

    prisma.$queryRaw.mockResolvedValueOnce([
      {
        day: activeDay,
        pageViews: 12,
        linkClicks: 4,
        smartLinkResolutions: 2,
      },
    ]);

    const result = await service.getProTrends('artist_123', '7d');

    expect(result.series.pageViews.length).toBeGreaterThan(1);
    expect(result.series.pageViews.some((point) => point.value === 12)).toBe(true);
    expect(result.series.pageViews.some((point) => point.value === 0)).toBe(true);
  });
});
