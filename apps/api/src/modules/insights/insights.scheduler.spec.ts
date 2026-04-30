import { InsightsSyncScheduler } from './insights.scheduler';

describe('InsightsSyncScheduler', () => {
  const makeService = (
    overrides: Partial<{
      findConnectionsDueForScheduledSync: jest.Mock;
      syncConnectionByRecord: jest.Mock;
    }> = {},
  ) => ({
    findConnectionsDueForScheduledSync: jest.fn().mockResolvedValue([]),
    syncConnectionByRecord: jest.fn().mockResolvedValue(true),
    ...overrides,
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('does nothing when no connections are due', async () => {
    const service = makeService();
    const scheduler = new InsightsSyncScheduler(service as never);

    await scheduler.runDailySync();

    expect(service.findConnectionsDueForScheduledSync).toHaveBeenCalledTimes(1);
    expect(service.syncConnectionByRecord).not.toHaveBeenCalled();
  });

  it('syncs each due connection in sequence', async () => {
    const connections = [
      { id: 'conn_1', platform: 'spotify', artistId: 'artist_1' },
      { id: 'conn_2', platform: 'youtube', artistId: 'artist_2' },
    ];
    const service = makeService({
      findConnectionsDueForScheduledSync: jest.fn().mockResolvedValue(connections),
    });
    const scheduler = new InsightsSyncScheduler(service as never);

    await scheduler.runDailySync();

    expect(service.syncConnectionByRecord).toHaveBeenCalledTimes(2);
    expect(service.syncConnectionByRecord).toHaveBeenNthCalledWith(1, connections[0]);
    expect(service.syncConnectionByRecord).toHaveBeenNthCalledWith(2, connections[1]);
  });

  it('continues batch when an individual sync fails', async () => {
    const connections = [
      { id: 'conn_1', platform: 'spotify', artistId: 'artist_1' },
      { id: 'conn_2', platform: 'youtube', artistId: 'artist_2' },
    ];
    const service = makeService({
      findConnectionsDueForScheduledSync: jest.fn().mockResolvedValue(connections),
      syncConnectionByRecord: jest
        .fn()
        .mockRejectedValueOnce(new Error('API error')) // first sync fails
        .mockResolvedValueOnce(undefined), // second sync succeeds
    });
    const scheduler = new InsightsSyncScheduler(service as never);

    // Should not throw even though one sync failed
    await expect(scheduler.runDailySync()).resolves.toBeUndefined();

    expect(service.syncConnectionByRecord).toHaveBeenCalledTimes(2);
  });

  it('continues batch when a queued connection returns a handled failure', async () => {
    const connections = [
      { id: 'conn_1', platform: 'spotify', artistId: 'artist_1' },
      { id: 'conn_2', platform: 'youtube', artistId: 'artist_2' },
    ];
    const service = makeService({
      findConnectionsDueForScheduledSync: jest.fn().mockResolvedValue(connections),
      syncConnectionByRecord: jest.fn().mockResolvedValueOnce(false).mockResolvedValueOnce(true),
    });
    const scheduler = new InsightsSyncScheduler(service as never);

    await expect(scheduler.runDailySync()).resolves.toBeUndefined();

    expect(service.syncConnectionByRecord).toHaveBeenCalledTimes(2);
    expect(service.syncConnectionByRecord).toHaveBeenNthCalledWith(2, connections[1]);
  });

  it('skips the batch if a previous run is still in progress', async () => {
    const connections = [{ id: 'conn_1', platform: 'spotify', artistId: 'artist_1' }];
    // Make the sync take "forever" so we can test the concurrency guard
    let resolveSync!: () => void;
    const slowSyncPromise = new Promise<void>((resolve) => {
      resolveSync = resolve;
    });
    const service = makeService({
      findConnectionsDueForScheduledSync: jest.fn().mockResolvedValue(connections),
      syncConnectionByRecord: jest.fn().mockReturnValue(slowSyncPromise),
    });
    const scheduler = new InsightsSyncScheduler(service as never);

    // Start first batch (doesn't await — simulates it running in background)
    const firstBatch = scheduler.runDailySync();

    // Immediately fire second batch while first is still running
    await scheduler.runDailySync();

    // Second batch should have been skipped
    expect(service.syncConnectionByRecord).toHaveBeenCalledTimes(1);

    // Clean up: let the first batch finish
    resolveSync();
    await firstBatch;
  });

  it('handles errors from findConnectionsDueForScheduledSync gracefully', async () => {
    const service = makeService({
      findConnectionsDueForScheduledSync: jest.fn().mockRejectedValue(new Error('DB error')),
    });
    const scheduler = new InsightsSyncScheduler(service as never);

    // Should not throw even if the DB query fails
    await expect(scheduler.runDailySync()).resolves.toBeUndefined();
    expect(service.syncConnectionByRecord).not.toHaveBeenCalled();
  });
});
