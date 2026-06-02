import { OnboardingEmailsCron } from './onboarding-emails.cron';
import type { OnboardingEmailsService } from './onboarding-emails.service';
import type { PrismaService } from '../../lib/prisma.service';

describe('OnboardingEmailsCron', () => {
  const makeCandidate = (id: string, blockCount: number) => ({
    id,
    page: { _count: { blocks: blockCount } },
  });

  const makeCron = (
    overrides: {
      candidates?: ReturnType<typeof makeCandidate>[];
      sendReengagementEmail?: jest.Mock;
      prismaError?: Error;
    } = {},
  ) => {
    const prisma = {
      artist: {
        findMany: overrides.prismaError
          ? jest.fn().mockRejectedValue(overrides.prismaError)
          : jest.fn().mockResolvedValue(overrides.candidates ?? []),
      },
    };

    const onboardingEmails = {
      sendReengagementEmail:
        overrides.sendReengagementEmail ?? jest.fn().mockResolvedValue(undefined),
    };

    const cron = new OnboardingEmailsCron(
      prisma as unknown as PrismaService,
      onboardingEmails as unknown as OnboardingEmailsService,
    );

    return { cron, prisma, onboardingEmails };
  };

  beforeEach(() => jest.clearAllMocks());

  it('does nothing when no candidates are found', async () => {
    const { cron, onboardingEmails } = makeCron({ candidates: [] });

    await cron.checkAbandonedDrafts();

    expect(onboardingEmails.sendReengagementEmail).not.toHaveBeenCalled();
  });

  it('sends variant A for an artist that has blocks but did not publish', async () => {
    const { cron, onboardingEmails } = makeCron({
      candidates: [makeCandidate('artist_1', 2)],
    });

    await cron.checkAbandonedDrafts();

    expect(onboardingEmails.sendReengagementEmail).toHaveBeenCalledTimes(1);
    expect(onboardingEmails.sendReengagementEmail).toHaveBeenCalledWith('artist_1', 'A');
  });

  it('sends variant B for an artist with no blocks at all', async () => {
    const { cron, onboardingEmails } = makeCron({
      candidates: [makeCandidate('artist_1', 0)],
    });

    await cron.checkAbandonedDrafts();

    expect(onboardingEmails.sendReengagementEmail).toHaveBeenCalledWith('artist_1', 'B');
  });

  it('processes multiple candidates and sends the correct variant to each', async () => {
    const { cron, onboardingEmails } = makeCron({
      candidates: [makeCandidate('artist_with_blocks', 3), makeCandidate('artist_no_blocks', 0)],
    });

    await cron.checkAbandonedDrafts();

    expect(onboardingEmails.sendReengagementEmail).toHaveBeenCalledTimes(2);
    expect(onboardingEmails.sendReengagementEmail).toHaveBeenNthCalledWith(
      1,
      'artist_with_blocks',
      'A',
    );
    expect(onboardingEmails.sendReengagementEmail).toHaveBeenNthCalledWith(
      2,
      'artist_no_blocks',
      'B',
    );
  });

  it('continues processing remaining candidates when one send fails', async () => {
    const { cron, onboardingEmails } = makeCron({
      candidates: [makeCandidate('artist_1', 1), makeCandidate('artist_2', 0)],
      sendReengagementEmail: jest
        .fn()
        .mockRejectedValueOnce(new Error('send failed'))
        .mockResolvedValueOnce(undefined),
    });

    await expect(cron.checkAbandonedDrafts()).resolves.toBeUndefined();

    expect(onboardingEmails.sendReengagementEmail).toHaveBeenCalledTimes(2);
    expect(onboardingEmails.sendReengagementEmail).toHaveBeenNthCalledWith(2, 'artist_2', 'B');
  });

  it('does not throw when the DB query itself fails', async () => {
    const { cron, onboardingEmails } = makeCron({
      prismaError: new Error('DB connection error'),
    });

    await expect(cron.checkAbandonedDrafts()).resolves.toBeUndefined();

    expect(onboardingEmails.sendReengagementEmail).not.toHaveBeenCalled();
  });

  it('queries only artists eligible for re-engagement (48h cutoff + welcome guard)', async () => {
    const { cron, prisma } = makeCron({ candidates: [] });

    await cron.checkAbandonedDrafts();

    const [query] = (prisma.artist.findMany as jest.Mock).mock.calls[0] as [
      { where: Record<string, unknown> },
    ];

    // Must filter by createdAt < 48h ago
    expect(query.where).toMatchObject({
      createdAt: { lt: expect.any(Date) },
    });

    // Must require page to be unpublished
    expect(query.where).toMatchObject({
      page: { isPublished: false },
    });

    // Must require welcome email sent (prevents bulk-emailing pre-launch artists)
    // and no prior re-engagement email
    expect(query.where).toMatchObject({
      onboardingState: {
        welcomeEmailSentAt: { not: null },
        reengagementEmailSentAt: null,
      },
    });
  });
});
