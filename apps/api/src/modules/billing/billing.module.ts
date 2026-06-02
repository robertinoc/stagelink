import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { EmailModule } from '../email/email.module';
import { BillingEntitlementsService } from './billing-entitlements.service';
import { BillingController } from './billing.controller';
import { BillingScheduler } from './billing.scheduler';
import { BillingService } from './billing.service';
import { STRIPE_CLIENT } from './billing.service';

@Module({
  imports: [EmailModule],
  controllers: [BillingController],
  providers: [
    BillingService,
    BillingEntitlementsService,
    BillingScheduler,
    {
      provide: STRIPE_CLIENT,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const secretKey = configService.get<string>('stripe.secretKey');
        if (!secretKey) return null;
        return new Stripe(secretKey);
      },
    },
  ],
  exports: [BillingService, BillingEntitlementsService],
})
export class BillingModule {}
