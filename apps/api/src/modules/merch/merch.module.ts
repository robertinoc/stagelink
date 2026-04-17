import { Module } from '@nestjs/common';
import { BillingModule } from '../billing/billing.module';
import { MerchController } from './merch.controller';
import { MerchService } from './merch.service';
import { PrintfulProviderService } from './providers/printful.provider';

@Module({
  imports: [BillingModule],
  controllers: [MerchController],
  providers: [MerchService, PrintfulProviderService],
  exports: [MerchService],
})
export class MerchModule {}
