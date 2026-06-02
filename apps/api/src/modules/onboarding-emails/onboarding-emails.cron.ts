import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../lib/prisma.service';
import { OnboardingEmailsService } from './onboarding-emails.service';

@Injectable()
export class OnboardingEmailsCron {
  private readonly logger = new Logger(OnboardingEmailsCron.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly onboardingEmails: OnboardingEmailsService,
  ) {}

  /**
   * Runs every hour. Finds artists who:
   *   - Registered more than 48 hours ago
   *   - Have an unpublished page (still in draft)
   *   - Received the welcome email (opt-in guard: avoids bulk-emailing pre-launch artists)
   *   - Have NOT yet received the re-engagement email
   *
   * Assumption: only artists who went through the new welcome-email flow are eligible.
   * Pre-existing artists (no onboarding_state row, or welcomeEmailSentAt IS NULL) are skipped.
   */
  @Cron(CronExpression.EVERY_HOUR)
  async checkAbandonedDrafts(): Promise<void> {
    const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000);

    // Find eligible artists via a join on onboarding_state and page.
    // We need: artist.createdAt < cutoff, page.isPublished=false,
    // onboardingState.welcomeEmailSentAt IS NOT NULL, onboardingState.reengagementEmailSentAt IS NULL.
    const candidates = await this.prisma.artist.findMany({
      where: {
        createdAt: { lt: cutoff },
        page: { isPublished: false },
        onboardingState: {
          welcomeEmailSentAt: { not: null },
          reengagementEmailSentAt: null,
        },
      },
      select: {
        id: true,
        page: {
          select: {
            _count: { select: { blocks: true } },
          },
        },
      },
    });

    if (candidates.length === 0) return;

    this.logger.log(`Re-engagement cron: ${candidates.length} candidate(s) found`);

    for (const artist of candidates) {
      // Variant A: has at least one block but didn't publish.
      // Variant B: no blocks at all (fully inactive).
      const variant = (artist.page?._count?.blocks ?? 0) > 0 ? 'A' : 'B';

      try {
        await this.onboardingEmails.sendReengagementEmail(artist.id, variant);
      } catch (err) {
        this.logger.error(`Re-engagement send failed for artistId=${artist.id}: ${String(err)}`);
      }
    }
  }
}
