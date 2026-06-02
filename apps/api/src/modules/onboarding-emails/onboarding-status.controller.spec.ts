import { ForbiddenException } from '@nestjs/common';
import { OnboardingStatusController } from './onboarding-status.controller';
import type { OnboardingEmailsService } from './onboarding-emails.service';
import type { MembershipService } from '../membership/membership.service';
import type { User } from '@prisma/client';

describe('OnboardingStatusController', () => {
  const ARTIST_ID = 'artist_1';

  const user = {
    id: 'user_1',
    email: 'artist@example.com',
  } as unknown as User;

  const statusPayload = {
    currentStep: 2,
    totalSteps: 3,
    isCompleted: false,
    isDismissed: false,
    steps: [],
  };

  const tipsPayload = {
    currentStep: 2,
    isDismissed: false,
    tip: { title: 'Agrega tu primer bloque', body: '...' },
  };

  const makeController = (
    overrides: {
      validateAccessError?: Error;
      getStatus?: jest.Mock;
      getTips?: jest.Mock;
      dismiss?: jest.Mock;
    } = {},
  ) => {
    const membership = {
      validateAccess: overrides.validateAccessError
        ? jest.fn().mockRejectedValue(overrides.validateAccessError)
        : jest.fn().mockResolvedValue(undefined),
    };

    const onboardingEmails = {
      getStatus: overrides.getStatus ?? jest.fn().mockResolvedValue(statusPayload),
      getTips: overrides.getTips ?? jest.fn().mockResolvedValue(tipsPayload),
      dismiss: overrides.dismiss ?? jest.fn().mockResolvedValue(undefined),
    };

    const controller = new OnboardingStatusController(
      onboardingEmails as unknown as OnboardingEmailsService,
      membership as unknown as MembershipService,
    );

    return { controller, membership, onboardingEmails };
  };

  beforeEach(() => jest.clearAllMocks());

  // ─── GET /onboarding/status/:artistId ──────────────────────────────────────

  describe('getStatus', () => {
    it('validates read access and returns the status payload', async () => {
      const { controller, membership, onboardingEmails } = makeController();

      const result = await controller.getStatus(ARTIST_ID, user);

      expect(membership.validateAccess).toHaveBeenCalledWith(user.id, ARTIST_ID, 'read');
      expect(onboardingEmails.getStatus).toHaveBeenCalledWith(ARTIST_ID);
      expect(result).toEqual(statusPayload);
    });

    it('surfaces ForbiddenException from membership check without calling the service', async () => {
      const { controller, onboardingEmails } = makeController({
        validateAccessError: new ForbiddenException('no access'),
      });

      await expect(controller.getStatus(ARTIST_ID, user)).rejects.toThrow(ForbiddenException);

      expect(onboardingEmails.getStatus).not.toHaveBeenCalled();
    });
  });

  // ─── GET /onboarding/tips/:artistId ────────────────────────────────────────

  describe('getTips', () => {
    it('validates read access and returns the tips payload', async () => {
      const { controller, membership, onboardingEmails } = makeController();

      const result = await controller.getTips(ARTIST_ID, user);

      expect(membership.validateAccess).toHaveBeenCalledWith(user.id, ARTIST_ID, 'read');
      expect(onboardingEmails.getTips).toHaveBeenCalledWith(ARTIST_ID);
      expect(result).toEqual(tipsPayload);
    });

    it('surfaces ForbiddenException without calling the service', async () => {
      const { controller, onboardingEmails } = makeController({
        validateAccessError: new ForbiddenException('no access'),
      });

      await expect(controller.getTips(ARTIST_ID, user)).rejects.toThrow(ForbiddenException);

      expect(onboardingEmails.getTips).not.toHaveBeenCalled();
    });
  });

  // ─── POST /onboarding/dismiss/:artistId ────────────────────────────────────

  describe('dismiss', () => {
    it('validates write access, calls dismiss, and returns { ok: true }', async () => {
      const { controller, membership, onboardingEmails } = makeController();

      const result = await controller.dismiss(ARTIST_ID, user);

      expect(membership.validateAccess).toHaveBeenCalledWith(user.id, ARTIST_ID, 'write');
      expect(onboardingEmails.dismiss).toHaveBeenCalledWith(ARTIST_ID);
      expect(result).toEqual({ ok: true });
    });

    it('surfaces ForbiddenException without calling dismiss', async () => {
      const { controller, onboardingEmails } = makeController({
        validateAccessError: new ForbiddenException('no access'),
      });

      await expect(controller.dismiss(ARTIST_ID, user)).rejects.toThrow(ForbiddenException);

      expect(onboardingEmails.dismiss).not.toHaveBeenCalled();
    });

    it('requires write access, not just read access', async () => {
      const { controller, membership } = makeController();

      await controller.dismiss(ARTIST_ID, user);

      const [, , accessLevel] = (membership.validateAccess as jest.Mock).mock.calls[0] as [
        string,
        string,
        string,
      ];
      expect(accessLevel).toBe('write');
    });
  });
});
