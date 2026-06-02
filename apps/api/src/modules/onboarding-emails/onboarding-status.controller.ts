import { Controller, Get, Post, Param } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators';
import type { User } from '@prisma/client';
import { MembershipService } from '../membership/membership.service';
import { OnboardingEmailsService } from './onboarding-emails.service';

@Controller('onboarding')
export class OnboardingStatusController {
  constructor(
    private readonly onboardingEmails: OnboardingEmailsService,
    private readonly membership: MembershipService,
  ) {}

  /** Returns the current onboarding step (1–3) and per-step completion state. */
  @Get('status/:artistId')
  async getStatus(@Param('artistId') artistId: string, @CurrentUser() user: User) {
    await this.membership.validateAccess(user.id, artistId, 'read');
    return this.onboardingEmails.getStatus(artistId);
  }

  /** Returns the contextual tooltip for the current onboarding step. */
  @Get('tips/:artistId')
  async getTips(@Param('artistId') artistId: string, @CurrentUser() user: User) {
    await this.membership.validateAccess(user.id, artistId, 'read');
    return this.onboardingEmails.getTips(artistId);
  }

  /** Marks the onboarding checklist as dismissed for this artist. */
  @Post('dismiss/:artistId')
  async dismiss(@Param('artistId') artistId: string, @CurrentUser() user: User) {
    await this.membership.validateAccess(user.id, artistId, 'write');
    await this.onboardingEmails.dismiss(artistId);
    return { ok: true };
  }
}
