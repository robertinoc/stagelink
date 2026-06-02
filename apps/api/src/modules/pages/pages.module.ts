import { Module } from '@nestjs/common';
import { OnboardingEmailsModule } from '../onboarding-emails/onboarding-emails.module';
import { PagesController } from './pages.controller';
import { PagesService } from './pages.service';

@Module({
  imports: [OnboardingEmailsModule],
  controllers: [PagesController],
  providers: [PagesService],
  exports: [PagesService],
})
export class PagesModule {}
