import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../lib/prisma.service';
import { EmailService } from '../email/email.service';

/**
 * BillingScheduler
 *
 * Runs daily at 09:00 UTC and sends a "trial expiring in 7 days" email
 * to every artist whose signup trial (manualAccessReason = 'signup_trial')
 * expires within the next 6–8 day window.
 *
 * The ±1-day window (6–8 days instead of exactly 7) ensures the email
 * is not missed if the cron fires slightly early or late, while staying
 * narrow enough to avoid double-sending on back-to-back runs.
 */
@Injectable()
export class BillingScheduler {
  private readonly logger = new Logger(BillingScheduler.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_9AM, { name: 'billing-trial-expiry-warning' })
  async sendTrialExpiryWarnings(): Promise<void> {
    const now = new Date();
    const windowStart = new Date(now);
    windowStart.setDate(windowStart.getDate() + 6);
    const windowEnd = new Date(now);
    windowEnd.setDate(windowEnd.getDate() + 8);

    let subscriptions: Awaited<ReturnType<typeof this.findExpiringTrials>>;
    try {
      subscriptions = await this.findExpiringTrials(windowStart, windowEnd);
    } catch (err) {
      this.logger.error('[trial-expiry] Failed to query expiring trials — aborting', err);
      return;
    }

    if (subscriptions.length === 0) {
      this.logger.log('[trial-expiry] No trials expiring in 7 days — nothing to do');
      return;
    }

    this.logger.log(`[trial-expiry] Found ${subscriptions.length} trial(s) expiring soon`);

    let sent = 0;
    let errors = 0;

    for (const sub of subscriptions) {
      const membership = sub.artist?.memberships?.[0];
      if (!membership?.user?.email) {
        this.logger.warn(`[trial-expiry] No owner email for artistId=${sub.artistId} — skipping`);
        continue;
      }

      try {
        await this.emailService.sendTrialExpiringSoon(
          membership.user.email,
          membership.user.firstName,
          sub.manualAccessExpiresAt!,
        );
        sent++;
      } catch (err) {
        this.logger.error(`[trial-expiry] Failed to send email to ${membership.user.email}`, err);
        errors++;
      }
    }

    this.logger.log(`[trial-expiry] Done — ${sent} sent, ${errors} errors`);
  }

  private findExpiringTrials(windowStart: Date, windowEnd: Date) {
    return this.prisma.subscription.findMany({
      where: {
        manualAccessPlan: { not: null },
        manualAccessReason: 'signup_trial',
        manualAccessExpiresAt: {
          gte: windowStart,
          lte: windowEnd,
        },
      },
      select: {
        artistId: true,
        manualAccessExpiresAt: true,
        artist: {
          select: {
            memberships: {
              where: { role: 'owner' },
              take: 1,
              select: {
                user: {
                  select: { email: true, firstName: true },
                },
              },
            },
          },
        },
      },
    });
  }
}
