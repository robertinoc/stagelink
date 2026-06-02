import { OnboardingEmailsService } from './onboarding-emails.service';
import type { EmailService } from '../email/email.service';
import type { PrismaService } from '../../lib/prisma.service';

describe('OnboardingEmailsService', () => {
  const ARTIST_ID = 'artist_1';
  const USER_EMAIL = 'artist@example.com';
  const DISPLAY_NAME = 'DJ Example';
  const USERNAME = 'djexample';

  const artistRow = {
    id: ARTIST_ID,
    username: USERNAME,
    displayName: DISPLAY_NAME,
    user: { email: USER_EMAIL },
  };

  const makeService = (
    overrides: {
      prisma?: Partial<{
        onboardingState: Partial<Record<string, jest.Mock>>;
        analyticsEvent: Partial<Record<string, jest.Mock>>;
        artist: Partial<Record<string, jest.Mock>>;
        page: Partial<Record<string, jest.Mock>>;
      }>;
      emailService?: Partial<Record<string, jest.Mock>>;
    } = {},
  ) => {
    const prisma = {
      onboardingState: {
        findUnique: jest.fn().mockResolvedValue(null),
        upsert: jest.fn().mockResolvedValue({}),
        ...overrides.prisma?.onboardingState,
      },
      analyticsEvent: {
        create: jest.fn().mockResolvedValue({ id: 'event_1' }),
        ...overrides.prisma?.analyticsEvent,
      },
      artist: {
        findUnique: jest.fn().mockResolvedValue(artistRow),
        ...overrides.prisma?.artist,
      },
      page: {
        findUnique: jest.fn().mockResolvedValue({ isPublished: false, _count: { blocks: 0 } }),
        ...overrides.prisma?.page,
      },
    };

    const emailService = {
      sendOnboardingWelcome: jest.fn().mockResolvedValue(undefined),
      sendOnboardingReengagement: jest.fn().mockResolvedValue(undefined),
      sendOnboardingActivation: jest.fn().mockResolvedValue(undefined),
      ...overrides.emailService,
    };

    const service = new OnboardingEmailsService(
      prisma as unknown as PrismaService,
      emailService as unknown as EmailService,
    );

    return { service, prisma, emailService };
  };

  beforeEach(() => jest.clearAllMocks());

  // ─── sendWelcomeEmail ──────────────────────────────────────────────────────

  describe('sendWelcomeEmail', () => {
    it('sends email and upserts state when no prior state exists', async () => {
      const { service, prisma, emailService } = makeService();

      await service.sendWelcomeEmail(ARTIST_ID);

      expect(emailService.sendOnboardingWelcome).toHaveBeenCalledWith(USER_EMAIL, DISPLAY_NAME);
      expect(prisma.onboardingState.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { artistId: ARTIST_ID },
          update: expect.objectContaining({ welcomeEmailSentAt: expect.any(Date) }),
          create: expect.objectContaining({
            artistId: ARTIST_ID,
            welcomeEmailSentAt: expect.any(Date),
          }),
        }),
      );
    });

    it('sends email when state exists but welcomeEmailSentAt is null', async () => {
      const { service, emailService } = makeService({
        prisma: {
          onboardingState: {
            findUnique: jest.fn().mockResolvedValue({ welcomeEmailSentAt: null }),
          },
        },
      });

      await service.sendWelcomeEmail(ARTIST_ID);

      expect(emailService.sendOnboardingWelcome).toHaveBeenCalledTimes(1);
    });

    it('skips sending if welcome email was already sent (idempotency)', async () => {
      const { service, emailService, prisma } = makeService({
        prisma: {
          onboardingState: {
            findUnique: jest.fn().mockResolvedValue({ welcomeEmailSentAt: new Date() }),
          },
        },
      });

      await service.sendWelcomeEmail(ARTIST_ID);

      expect(emailService.sendOnboardingWelcome).not.toHaveBeenCalled();
      expect(prisma.onboardingState.upsert).not.toHaveBeenCalled();
    });

    it('skips silently if artist is not found', async () => {
      const { service, emailService } = makeService({
        prisma: {
          artist: { findUnique: jest.fn().mockResolvedValue(null) },
        },
      });

      await service.sendWelcomeEmail(ARTIST_ID);

      expect(emailService.sendOnboardingWelcome).not.toHaveBeenCalled();
    });

    it('records an analytics event after sending', async () => {
      const { service, prisma } = makeService();

      await service.sendWelcomeEmail(ARTIST_ID);

      expect(prisma.analyticsEvent.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            artistId: ARTIST_ID,
            eventType: 'onboarding_email_sent',
            label: 'welcome',
          }),
        }),
      );
    });

    it('does not surface analytics failures to the caller', async () => {
      const { service } = makeService({
        prisma: {
          analyticsEvent: {
            create: jest.fn().mockRejectedValue(new Error('DB error')),
          },
        },
      });

      await expect(service.sendWelcomeEmail(ARTIST_ID)).resolves.toBeUndefined();
    });
  });

  // ─── sendReengagementEmail ─────────────────────────────────────────────────

  describe('sendReengagementEmail', () => {
    it('sends variant A email and records the variant in state', async () => {
      const { service, emailService, prisma } = makeService();

      await service.sendReengagementEmail(ARTIST_ID, 'A');

      expect(emailService.sendOnboardingReengagement).toHaveBeenCalledWith(
        USER_EMAIL,
        DISPLAY_NAME,
        'A',
      );
      expect(prisma.onboardingState.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          update: expect.objectContaining({
            reengagementEmailSentAt: expect.any(Date),
            reengagementVariant: 'A',
          }),
          create: expect.objectContaining({ reengagementVariant: 'A' }),
        }),
      );
      expect(prisma.analyticsEvent.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ label: 'reengagement_a' }),
        }),
      );
    });

    it('sends variant B email and records the variant in state', async () => {
      const { service, emailService, prisma } = makeService();

      await service.sendReengagementEmail(ARTIST_ID, 'B');

      expect(emailService.sendOnboardingReengagement).toHaveBeenCalledWith(
        USER_EMAIL,
        DISPLAY_NAME,
        'B',
      );
      expect(prisma.analyticsEvent.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ label: 'reengagement_b' }),
        }),
      );
    });

    it('skips sending if re-engagement was already sent (idempotency)', async () => {
      const { service, emailService } = makeService({
        prisma: {
          onboardingState: {
            findUnique: jest.fn().mockResolvedValue({ reengagementEmailSentAt: new Date() }),
          },
        },
      });

      await service.sendReengagementEmail(ARTIST_ID, 'A');

      expect(emailService.sendOnboardingReengagement).not.toHaveBeenCalled();
    });
  });

  // ─── sendActivationEmail ───────────────────────────────────────────────────

  describe('sendActivationEmail', () => {
    it('sends email and upserts state on first call', async () => {
      const { service, emailService, prisma } = makeService();

      await service.sendActivationEmail(ARTIST_ID);

      expect(emailService.sendOnboardingActivation).toHaveBeenCalledWith(
        USER_EMAIL,
        DISPLAY_NAME,
        USERNAME,
      );
      expect(prisma.onboardingState.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          update: expect.objectContaining({ activationEmailSentAt: expect.any(Date) }),
        }),
      );
      expect(prisma.analyticsEvent.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ label: 'activation' }),
        }),
      );
    });

    it('skips sending if activation email was already sent (idempotency)', async () => {
      const { service, emailService } = makeService({
        prisma: {
          onboardingState: {
            findUnique: jest.fn().mockResolvedValue({ activationEmailSentAt: new Date() }),
          },
        },
      });

      await service.sendActivationEmail(ARTIST_ID);

      expect(emailService.sendOnboardingActivation).not.toHaveBeenCalled();
    });

    it('skips silently if artist is not found', async () => {
      const { service, emailService } = makeService({
        prisma: {
          artist: { findUnique: jest.fn().mockResolvedValue(null) },
        },
      });

      await service.sendActivationEmail(ARTIST_ID);

      expect(emailService.sendOnboardingActivation).not.toHaveBeenCalled();
    });
  });

  // ─── getStatus ─────────────────────────────────────────────────────────────

  describe('getStatus', () => {
    it('returns currentStep=2 when artist has no blocks and page is not published', async () => {
      const { service } = makeService({
        prisma: {
          page: {
            findUnique: jest.fn().mockResolvedValue({ isPublished: false, _count: { blocks: 0 } }),
          },
        },
      });

      const result = await service.getStatus(ARTIST_ID);

      expect(result.currentStep).toBe(2);
      expect(result.isCompleted).toBe(false);
      expect(result.steps).toEqual([
        { step: 1, label: 'Perfil creado', completed: true },
        { step: 2, label: 'Agrega contenido', completed: false },
        { step: 3, label: 'Publica tu página', completed: false },
      ]);
    });

    it('returns currentStep=3 when artist has blocks but page is not published', async () => {
      const { service } = makeService({
        prisma: {
          page: {
            findUnique: jest.fn().mockResolvedValue({ isPublished: false, _count: { blocks: 2 } }),
          },
        },
      });

      const result = await service.getStatus(ARTIST_ID);

      expect(result.currentStep).toBe(3);
      expect(result.isCompleted).toBe(false);
      expect(result.steps.find((s) => s.step === 2)?.completed).toBe(true);
      expect(result.steps.find((s) => s.step === 3)?.completed).toBe(false);
    });

    it('returns currentStep=3 and isCompleted=true when page is published', async () => {
      const { service } = makeService({
        prisma: {
          page: {
            findUnique: jest.fn().mockResolvedValue({ isPublished: true, _count: { blocks: 3 } }),
          },
        },
      });

      const result = await service.getStatus(ARTIST_ID);

      expect(result.currentStep).toBe(3);
      expect(result.isCompleted).toBe(true);
      expect(result.steps.every((s) => s.completed)).toBe(true);
    });

    it('defaults to step 2 and isCompleted=false when page record is missing', async () => {
      const { service } = makeService({
        prisma: {
          page: { findUnique: jest.fn().mockResolvedValue(null) },
        },
      });

      const result = await service.getStatus(ARTIST_ID);

      expect(result.currentStep).toBe(2);
      expect(result.isCompleted).toBe(false);
    });

    it('reflects isDismissed from OnboardingState', async () => {
      const { service } = makeService({
        prisma: {
          onboardingState: {
            findUnique: jest.fn().mockResolvedValue({ isDismissed: true }),
          },
        },
      });

      const result = await service.getStatus(ARTIST_ID);

      expect(result.isDismissed).toBe(true);
    });

    it('returns isDismissed=false when no OnboardingState exists', async () => {
      const { service } = makeService();

      const result = await service.getStatus(ARTIST_ID);

      expect(result.isDismissed).toBe(false);
    });
  });

  // ─── getTips ───────────────────────────────────────────────────────────────

  describe('getTips', () => {
    it('returns the step-2 tip when artist has no blocks', async () => {
      const { service } = makeService({
        prisma: {
          page: {
            findUnique: jest.fn().mockResolvedValue({ isPublished: false, _count: { blocks: 0 } }),
          },
        },
      });

      const result = await service.getTips(ARTIST_ID);

      expect(result.currentStep).toBe(2);
      expect(result.tip?.title).toBe('Agrega tu primer bloque');
    });

    it('returns the step-3 tip when artist has blocks but page is not published', async () => {
      const { service } = makeService({
        prisma: {
          page: {
            findUnique: jest.fn().mockResolvedValue({ isPublished: false, _count: { blocks: 1 } }),
          },
        },
      });

      const result = await service.getTips(ARTIST_ID);

      expect(result.currentStep).toBe(3);
      expect(result.tip?.title).toBe('¡A un paso del lanzamiento!');
    });

    it('passes isDismissed through from status', async () => {
      const { service } = makeService({
        prisma: {
          onboardingState: {
            findUnique: jest.fn().mockResolvedValue({ isDismissed: true }),
          },
        },
      });

      const result = await service.getTips(ARTIST_ID);

      expect(result.isDismissed).toBe(true);
    });
  });

  // ─── dismiss ───────────────────────────────────────────────────────────────

  describe('dismiss', () => {
    it('upserts isDismissed=true creating a new record when none exists', async () => {
      const { service, prisma } = makeService();

      await service.dismiss(ARTIST_ID);

      expect(prisma.onboardingState.upsert).toHaveBeenCalledWith({
        where: { artistId: ARTIST_ID },
        update: { isDismissed: true },
        create: { artistId: ARTIST_ID, isDismissed: true },
      });
    });

    it('upserts isDismissed=true on an existing record', async () => {
      const { service, prisma } = makeService({
        prisma: {
          onboardingState: {
            findUnique: jest.fn().mockResolvedValue({ isDismissed: false }),
            upsert: jest.fn().mockResolvedValue({ isDismissed: true }),
          },
        },
      });

      await service.dismiss(ARTIST_ID);

      expect(prisma.onboardingState.upsert).toHaveBeenCalledWith(
        expect.objectContaining({ update: { isDismissed: true } }),
      );
    });
  });
});
