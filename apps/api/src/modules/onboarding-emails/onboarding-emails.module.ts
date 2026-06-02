import { Module } from '@nestjs/common';
import { EmailModule } from '../email/email.module';
import { MembershipModule } from '../membership/membership.module';
import { OnboardingEmailsCron } from './onboarding-emails.cron';
import { OnboardingEmailsService } from './onboarding-emails.service';
import { OnboardingStatusController } from './onboarding-status.controller';

@Module({
  imports: [EmailModule, MembershipModule],
  controllers: [OnboardingStatusController],
  providers: [OnboardingEmailsService, OnboardingEmailsCron],
  exports: [OnboardingEmailsService],
})
export class OnboardingEmailsModule {}
