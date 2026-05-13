import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { PrivacyController } from './privacy.controller';
import { PrivacyRateLimitGuard } from './privacy-rate-limit.guard';
import { PrivacyService } from './privacy.service';

@Module({
  imports: [AuditModule],
  controllers: [PrivacyController],
  providers: [PrivacyService, PrivacyRateLimitGuard],
})
export class PrivacyModule {}
