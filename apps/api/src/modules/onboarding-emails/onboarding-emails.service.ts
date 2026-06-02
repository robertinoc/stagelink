import { Injectable, Logger } from '@nestjs/common';
import { createHash } from 'crypto';
import type { AnalyticsEnvironment } from '@prisma/client';
import { PrismaService } from '../../lib/prisma.service';
import { EmailService } from '../email/email.service';

// Server-generated events have no visitor IP — use a stable placeholder hash.
const SYSTEM_IP_HASH = createHash('sha256').update('system').digest('hex');

function resolveEnvironment(): AnalyticsEnvironment {
  const env = process.env['NODE_ENV'];
  if (env === 'production') return 'production';
  if (env === 'staging') return 'staging';
  return 'development';
}

interface ArtistContact {
  id: string;
  username: string;
  displayName: string;
  email: string;
}

export type OnboardingEmailLabel = 'welcome' | 'reengagement_a' | 'reengagement_b' | 'activation';

@Injectable()
export class OnboardingEmailsService {
  private readonly logger = new Logger(OnboardingEmailsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  // ─── Welcome (T+0, fires after onboarding wizard) ───────────────────────────

  async sendWelcomeEmail(artistId: string): Promise<void> {
    const state = await this.prisma.onboardingState.findUnique({
      where: { artistId },
      select: { welcomeEmailSentAt: true },
    });
    if (state?.welcomeEmailSentAt) return;

    const contact = await this.loadContact(artistId);
    if (!contact) return;

    await this.emailService.sendOnboardingWelcome(contact.email, contact.displayName);

    await this.prisma.onboardingState.upsert({
      where: { artistId },
      update: { welcomeEmailSentAt: new Date() },
      create: { artistId, welcomeEmailSentAt: new Date() },
    });

    this.recordEmailEvent(artistId, 'welcome');
    this.logger.log(`Onboarding welcome sent artistId=${artistId}`);
  }

  // ─── Re-engagement (T+48 h, cron-triggered) ────────────────────────────────

  async sendReengagementEmail(artistId: string, variant: 'A' | 'B'): Promise<void> {
    const state = await this.prisma.onboardingState.findUnique({
      where: { artistId },
      select: { reengagementEmailSentAt: true },
    });
    if (state?.reengagementEmailSentAt) return;

    const contact = await this.loadContact(artistId);
    if (!contact) return;

    await this.emailService.sendOnboardingReengagement(contact.email, contact.displayName, variant);

    await this.prisma.onboardingState.upsert({
      where: { artistId },
      update: { reengagementEmailSentAt: new Date(), reengagementVariant: variant },
      create: { artistId, reengagementEmailSentAt: new Date(), reengagementVariant: variant },
    });

    const label: OnboardingEmailLabel = variant === 'A' ? 'reengagement_a' : 'reengagement_b';
    this.recordEmailEvent(artistId, label);
    this.logger.log(`Onboarding reengagement (variant=${variant}) sent artistId=${artistId}`);
  }

  // ─── Activation (fires on first page publish) ───────────────────────────────

  async sendActivationEmail(artistId: string): Promise<void> {
    const state = await this.prisma.onboardingState.findUnique({
      where: { artistId },
      select: { activationEmailSentAt: true },
    });
    if (state?.activationEmailSentAt) return;

    const contact = await this.loadContact(artistId);
    if (!contact) return;

    await this.emailService.sendOnboardingActivation(
      contact.email,
      contact.displayName,
      contact.username,
    );

    await this.prisma.onboardingState.upsert({
      where: { artistId },
      update: { activationEmailSentAt: new Date() },
      create: { artistId, activationEmailSentAt: new Date() },
    });

    this.recordEmailEvent(artistId, 'activation');
    this.logger.log(`Onboarding activation sent artistId=${artistId}`);
  }

  // ─── In-app onboarding status ───────────────────────────────────────────────

  async getStatus(artistId: string) {
    const [page, state] = await Promise.all([
      this.prisma.page.findUnique({
        where: { artistId },
        select: {
          isPublished: true,
          _count: { select: { blocks: true } },
        },
      }),
      this.prisma.onboardingState.findUnique({
        where: { artistId },
        select: { isDismissed: true },
      }),
    ]);

    const hasBlocks = (page?._count?.blocks ?? 0) > 0;
    const isPublished = page?.isPublished ?? false;

    // Step 1 is always done (artist exists). Steps 2 and 3 track content and publish.
    const steps = [
      { step: 1, label: 'Perfil creado', completed: true },
      { step: 2, label: 'Agrega contenido', completed: hasBlocks },
      { step: 3, label: 'Publica tu página', completed: isPublished },
    ];

    // currentStep = the first incomplete step, capped at 3.
    const currentStep = steps.find((s) => !s.completed)?.step ?? 3;

    return {
      currentStep,
      totalSteps: 3,
      isCompleted: isPublished,
      isDismissed: state?.isDismissed ?? false,
      steps,
    };
  }

  async getTips(artistId: string) {
    const status = await this.getStatus(artistId);

    const tips: Record<number, { title: string; body: string }> = {
      1: {
        title: 'Tu perfil está listo',
        body: 'Completá tu bio y subí un avatar para que tu página destaque.',
      },
      2: {
        title: 'Agrega tu primer bloque',
        body: 'Añadí un link, un embed de música o video para que tus fans te encuentren.',
      },
      3: {
        title: '¡A un paso del lanzamiento!',
        body: 'Tu contenido está listo. Publicá tu página y compartí el link con tu audiencia.',
      },
    };

    return {
      currentStep: status.currentStep,
      isDismissed: status.isDismissed,
      tip: tips[status.currentStep] ?? tips[3],
    };
  }

  async dismiss(artistId: string): Promise<void> {
    await this.prisma.onboardingState.upsert({
      where: { artistId },
      update: { isDismissed: true },
      create: { artistId, isDismissed: true },
    });
  }

  // ─── Internal helpers ───────────────────────────────────────────────────────

  private async loadContact(artistId: string): Promise<ArtistContact | null> {
    const artist = await this.prisma.artist.findUnique({
      where: { id: artistId },
      select: {
        id: true,
        username: true,
        displayName: true,
        user: { select: { email: true } },
      },
    });
    if (!artist) return null;
    return {
      id: artist.id,
      username: artist.username,
      displayName: artist.displayName,
      email: artist.user.email,
    };
  }

  // Fire-and-forget: never surfaces an error to the caller.
  private recordEmailEvent(artistId: string, label: OnboardingEmailLabel): void {
    this.prisma.analyticsEvent
      .create({
        data: {
          artistId,
          eventType: 'onboarding_email_sent',
          ipHash: SYSTEM_IP_HASH,
          label,
          environment: resolveEnvironment(),
        },
      })
      .catch((err) =>
        this.logger.warn(
          `Failed to record onboarding_email_sent event artistId=${artistId}: ${String(err)}`,
        ),
      );
  }
}
