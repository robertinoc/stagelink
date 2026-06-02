import { Test, TestingModule } from '@nestjs/testing';
import { BillingScheduler } from './billing.scheduler';
import { PrismaService } from '../../lib/prisma.service';
import { EmailService } from '../email/email.service';

const makeSub = (overrides: Record<string, unknown> = {}) => ({
  artistId: 'artist-1',
  manualAccessExpiresAt: new Date('2026-07-09'),
  artist: {
    memberships: [{ user: { email: 'artist@example.com', firstName: 'Robertino' } }],
  },
  ...overrides,
});

describe('BillingScheduler', () => {
  let scheduler: BillingScheduler;
  let prisma: { subscription: { findMany: jest.Mock } };
  let emailService: { sendTrialExpiringSoon: jest.Mock };

  beforeEach(async () => {
    prisma = { subscription: { findMany: jest.fn() } };
    emailService = { sendTrialExpiringSoon: jest.fn().mockResolvedValue(undefined) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BillingScheduler,
        { provide: PrismaService, useValue: prisma },
        { provide: EmailService, useValue: emailService },
      ],
    }).compile();

    scheduler = module.get(BillingScheduler);
  });

  it('sends email for each expiring trial', async () => {
    prisma.subscription.findMany.mockResolvedValue([makeSub()]);
    await scheduler.sendTrialExpiryWarnings();
    expect(emailService.sendTrialExpiringSoon).toHaveBeenCalledTimes(1);
    expect(emailService.sendTrialExpiringSoon).toHaveBeenCalledWith(
      'artist@example.com',
      'Robertino',
      new Date('2026-07-09'),
    );
  });

  it('does nothing when no trials are expiring', async () => {
    prisma.subscription.findMany.mockResolvedValue([]);
    await scheduler.sendTrialExpiryWarnings();
    expect(emailService.sendTrialExpiringSoon).not.toHaveBeenCalled();
  });

  it('skips subscriptions without an owner email', async () => {
    prisma.subscription.findMany.mockResolvedValue([makeSub({ artist: { memberships: [] } })]);
    await scheduler.sendTrialExpiryWarnings();
    expect(emailService.sendTrialExpiringSoon).not.toHaveBeenCalled();
  });

  it('continues sending to remaining artists if one email fails', async () => {
    prisma.subscription.findMany.mockResolvedValue([
      makeSub({
        artistId: 'artist-1',
        artist: { memberships: [{ user: { email: 'a@example.com', firstName: 'A' } }] },
      }),
      makeSub({
        artistId: 'artist-2',
        artist: { memberships: [{ user: { email: 'b@example.com', firstName: 'B' } }] },
      }),
    ]);
    emailService.sendTrialExpiringSoon
      .mockRejectedValueOnce(new Error('SMTP error'))
      .mockResolvedValueOnce(undefined);

    await scheduler.sendTrialExpiryWarnings();

    expect(emailService.sendTrialExpiringSoon).toHaveBeenCalledTimes(2);
  });

  it('aborts gracefully if the DB query fails', async () => {
    prisma.subscription.findMany.mockRejectedValue(new Error('DB error'));
    await expect(scheduler.sendTrialExpiryWarnings()).resolves.not.toThrow();
    expect(emailService.sendTrialExpiringSoon).not.toHaveBeenCalled();
  });
});
