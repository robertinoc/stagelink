import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SYNC_BATCH_STAGGER_MS } from './insights-metrics.constants';
import { InsightsService } from './insights.service';

/**
 * InsightsSyncScheduler
 *
 * Runs a daily background sync for all artist platform connections that have
 * not been synced within the last 23 hours.
 *
 * Design decisions:
 *  - Runs at 06:00 UTC daily (off-peak for most markets)
 *  - Processes connections sequentially with a 2-second stagger to avoid
 *    thundering-herd API bursts (SoundCloud is rate-limit-sensitive)
 *  - Individual sync failures are logged and skipped — the batch continues
 *  - Errors are persisted to the connection record by InsightsService
 *
 * Multi-instance / Railway note:
 *  If Railway scales to multiple instances, this cron will fire on all of
 *  them simultaneously. The concurrent-sync guard in InsightsService
 *  (SYNC_CONCURRENT_GUARD_MS) prevents duplicate syncs within 2 minutes,
 *  so duplicate runs on the same connection are blocked. For a proper
 *  single-leader guarantee, add a distributed lock (e.g. Redis SET NX).
 */
@Injectable()
export class InsightsSyncScheduler {
  private readonly logger = new Logger(InsightsSyncScheduler.name);
  private isRunning = false;

  constructor(private readonly insightsService: InsightsService) {}

  /**
   * Daily scheduled sync — fires every day at 06:00 UTC.
   *
   * Skips the run if a previous batch is still in progress (in-process guard).
   * This prevents overlap if the batch takes longer than 24 hours (extremely
   * unlikely, but safe to guard against).
   */
  @Cron(CronExpression.EVERY_DAY_AT_6AM, { name: 'insights-daily-sync' })
  async runDailySync(): Promise<void> {
    if (this.isRunning) {
      this.logger.warn('[scheduler] Previous batch still running — skipping this cycle');
      return;
    }

    this.isRunning = true;
    const batchStart = Date.now();

    try {
      let connections: Awaited<
        ReturnType<typeof this.insightsService.findConnectionsDueForScheduledSync>
      >;
      try {
        connections = await this.insightsService.findConnectionsDueForScheduledSync();
      } catch (lookupError) {
        this.logger.error(
          `[scheduler] Failed to load connections due for sync — aborting batch: ${String(lookupError)}`,
        );
        return;
      }

      if (connections.length === 0) {
        this.logger.log('[scheduler] No connections due for sync — nothing to do');
        return;
      }

      this.logger.log(`[scheduler] Starting daily sync for ${connections.length} connection(s)`);

      let syncedCount = 0;
      let errorCount = 0;

      for (const connection of connections) {
        try {
          const didSync = await this.insightsService.syncConnectionByRecord(connection);
          if (didSync) {
            syncedCount++;
          } else {
            errorCount++;
          }
        } catch {
          errorCount++;
        }

        // Stagger between connections to avoid API rate-limit bursts
        if (SYNC_BATCH_STAGGER_MS > 0) {
          await this.delay(SYNC_BATCH_STAGGER_MS);
        }
      }

      const elapsed = Math.round((Date.now() - batchStart) / 1000);
      this.logger.log(
        `[scheduler] Daily sync complete — ${syncedCount} synced, ${errorCount} errors, ${elapsed}s elapsed`,
      );
    } catch (error) {
      this.logger.error(`[scheduler] Batch sync failed with unexpected error: ${String(error)}`);
    } finally {
      this.isRunning = false;
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
