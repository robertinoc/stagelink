import { Module } from '@nestjs/common';
import { BillingModule } from '../billing/billing.module';
import { MembershipModule } from '../membership/membership.module';
import { AuditModule } from '../audit/audit.module';
import { EpkController } from './epk.controller';
import { EpkService } from './epk.service';

@Module({
  imports: [BillingModule, MembershipModule, AuditModule],
  controllers: [EpkController],
  providers: [EpkService],
  exports: [EpkService],
})
export class EpkModule {}
