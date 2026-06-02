import { NotFoundException } from '@nestjs/common';
import { PagesService } from './pages.service';
import type { MembershipService } from '../membership/membership.service';
import type { AuditService } from '../audit/audit.service';
import type { OnboardingEmailsService } from '../onboarding-emails/onboarding-emails.service';
import type { PrismaService } from '../../lib/prisma.service';

describe('PagesService', () => {
  const PAGE_ID = 'page_1';
  const ARTIST_ID = 'artist_1';
  const USER_ID = 'user_1';
  const updatedPage = { id: PAGE_ID, artistId: ARTIST_ID, isPublished: true };

  const makeService = (
    overrides: {
      currentIsPublished?: boolean;
      artistId?: string | null;
      sendActivationEmail?: jest.Mock;
    } = {},
  ) => {
    const prisma = {
      page: {
        findUnique: jest.fn().mockResolvedValue({
          isPublished: overrides.currentIsPublished ?? false,
        }),
        update: jest.fn().mockResolvedValue(updatedPage),
      },
    };

    const membershipService = {
      resolveArtistIdForResource: jest
        .fn()
        .mockResolvedValue(overrides.artistId === undefined ? ARTIST_ID : overrides.artistId),
      validateAccess: jest.fn().mockResolvedValue(undefined),
    };

    const auditService = { log: jest.fn() };

    const onboardingEmails = {
      sendActivationEmail: overrides.sendActivationEmail ?? jest.fn().mockResolvedValue(undefined),
    };

    const service = new PagesService(
      prisma as unknown as PrismaService,
      membershipService as unknown as MembershipService,
      auditService as unknown as AuditService,
      onboardingEmails as unknown as OnboardingEmailsService,
    );

    return { service, prisma, membershipService, auditService, onboardingEmails };
  };

  beforeEach(() => jest.clearAllMocks());

  // ─── Ownership guard ───────────────────────────────────────────────────────

  it('throws NotFoundException when page does not belong to any artist', async () => {
    const { service } = makeService({ artistId: null });

    await expect(service.update(PAGE_ID, { isPublished: true }, USER_ID)).rejects.toThrow(
      NotFoundException,
    );
  });

  // ─── First-time publish → activation email ─────────────────────────────────

  it('fires activation email when publishing for the first time (false → true)', async () => {
    const { service, onboardingEmails } = makeService({ currentIsPublished: false });

    await service.update(PAGE_ID, { isPublished: true }, USER_ID);

    expect(onboardingEmails.sendActivationEmail).toHaveBeenCalledWith(ARTIST_ID);
  });

  it('does NOT fire activation email when page was already published (re-publish)', async () => {
    const { service, onboardingEmails } = makeService({ currentIsPublished: true });

    await service.update(PAGE_ID, { isPublished: true }, USER_ID);

    expect(onboardingEmails.sendActivationEmail).not.toHaveBeenCalled();
  });

  it('does NOT fire activation email when update does not include isPublished', async () => {
    const { service, onboardingEmails, prisma } = makeService();

    await service.update(PAGE_ID, { title: 'New title' }, USER_ID);

    // No pre-fetch of current isPublished state — no publish check needed
    expect(prisma.page.findUnique).not.toHaveBeenCalled();
    expect(onboardingEmails.sendActivationEmail).not.toHaveBeenCalled();
  });

  it('does NOT fire activation email when explicitly setting isPublished=false', async () => {
    const { service, onboardingEmails } = makeService({ currentIsPublished: true });

    await service.update(PAGE_ID, { isPublished: false }, USER_ID);

    expect(onboardingEmails.sendActivationEmail).not.toHaveBeenCalled();
  });

  it('activation email failure does not surface to the caller (fire-and-forget)', async () => {
    const failingEmail = jest.fn().mockRejectedValue(new Error('email service down'));
    const { service } = makeService({
      currentIsPublished: false,
      sendActivationEmail: failingEmail,
    });

    await expect(service.update(PAGE_ID, { isPublished: true }, USER_ID)).resolves.toEqual(
      updatedPage,
    );
  });

  // ─── Audit log ─────────────────────────────────────────────────────────────

  it('writes an audit log entry on every update', async () => {
    const { service, auditService } = makeService();
    const dto = { isPublished: true };

    await service.update(PAGE_ID, dto, USER_ID, '203.0.113.5');

    expect(auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({
        actorId: USER_ID,
        action: 'page.update',
        entityId: PAGE_ID,
        metadata: { changes: dto },
        ipAddress: '203.0.113.5',
      }),
    );
  });
});
