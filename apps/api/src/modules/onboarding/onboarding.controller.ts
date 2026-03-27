import { Controller, Get, Post, Query, Body, Req } from '@nestjs/common';
import type { Request } from 'express';
import type { User } from '@prisma/client';
import { OnboardingService } from './onboarding.service';
import { CheckUsernameQueryDto, CompleteOnboardingDto } from './dto';
import { CurrentUser } from '../../common/decorators';
import { extractClientIp } from '../../common/utils/request.utils';

@Controller('onboarding')
export class OnboardingController {
  constructor(private readonly onboardingService: OnboardingService) {}

  /**
   * GET /api/onboarding/username-check?value=xxx
   * Checks if a username is available. Auth required (prevents username enumeration scraping).
   */
  @Get('username-check')
  checkUsername(@Query() query: CheckUsernameQueryDto) {
    return this.onboardingService.checkUsername(query.value);
  }

  /**
   * POST /api/onboarding/complete
   * Creates artist + page + membership in a single transaction.
   */
  @Post('complete')
  completeOnboarding(
    @Body() dto: CompleteOnboardingDto,
    @CurrentUser() user: User,
    @Req() req: Request,
  ) {
    const ip = extractClientIp(req);
    return this.onboardingService.completeOnboarding(dto, user, ip);
  }
}
