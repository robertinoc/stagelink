import { Controller, Get, Param } from '@nestjs/common';
import { BillingService } from './billing.service';

@Controller('billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  /**
   * GET /api/billing/:artistId/subscription
   * Returns current subscription status for an artist.
   * TODO: Integrate with Stripe, validate auth.
   */
  @Get(':artistId/subscription')
  getSubscription(@Param('artistId') artistId: string) {
    return this.billingService.getSubscription(artistId);
  }
}
