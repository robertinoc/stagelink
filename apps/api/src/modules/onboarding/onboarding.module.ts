import { Module } from '@nestjs/common';
import { OnboardingEmailsModule } from '../onboarding-emails/onboarding-emails.module';
import { OnboardingController } from './onboarding.controller';
import { OnboardingService } from './onboarding.service';

@Module({
  imports: [OnboardingEmailsModule],
  controllers: [OnboardingController],
  providers: [OnboardingService],
})
export class OnboardingModule {}
