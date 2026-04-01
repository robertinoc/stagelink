import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { BillingController } from './billing.controller';
import { BillingService } from './billing.service';
import { STRIPE_CLIENT } from './billing.service';

@Module({
  controllers: [BillingController],
  providers: [
    BillingService,
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
  exports: [BillingService],
})
export class BillingModule {}
