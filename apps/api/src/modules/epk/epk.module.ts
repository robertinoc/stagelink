import { Module } from '@nestjs/common';
import { BillingModule } from '../billing/billing.module';
import { MembershipModule } from '../membership/membership.module';
import { AuditModule } from '../audit/audit.module';
import { AiService } from '../../lib/ai.service';
import { EpkController } from './epk.controller';
import { EpkService } from './epk.service';

@Module({
  imports: [BillingModule, MembershipModule, AuditModule],
  controllers: [EpkController],
  providers: [EpkService, AiService],
  exports: [EpkService],
})
export class EpkModule {}
