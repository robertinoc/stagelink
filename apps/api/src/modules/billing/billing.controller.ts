import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import type { User } from '@prisma/client';
import { BillingService } from './billing.service';
import { CreateCheckoutSessionDto, CreatePortalSessionDto } from './dto';
import { OwnershipGuard } from '../../common/guards';
import { CheckOwnership, CurrentUser, Public } from '../../common/decorators';

@Controller('billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Get('products')
  getProducts() {
    return this.billingService.getProducts();
  }

  @Get(':artistId/subscription')
  @CheckOwnership('artist', 'artistId', 'read')
  @UseGuards(OwnershipGuard)
  getSubscription(@Param('artistId') artistId: string) {
    return this.billingService.getSubscription(artistId);
  }

  @Post(':artistId/checkout')
  @CheckOwnership('artist', 'artistId', 'admin')
  @UseGuards(OwnershipGuard)
  createCheckoutSession(
    @Param('artistId') artistId: string,
    @Body() dto: CreateCheckoutSessionDto,
    @CurrentUser() user: User,
  ) {
    return this.billingService.createCheckoutSession(artistId, dto, user);
  }

  @Post(':artistId/portal')
  @CheckOwnership('artist', 'artistId', 'admin')
  @UseGuards(OwnershipGuard)
  createPortalSession(@Param('artistId') artistId: string, @Body() dto: CreatePortalSessionDto) {
    return this.billingService.createPortalSession(artistId, dto);
  }

  @Public()
  @Post('webhook')
  handleWebhook(@Req() req: Request) {
    return this.billingService.handleWebhook(req);
  }
}
