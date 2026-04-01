import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import type { User } from '@prisma/client';
import { BillingEntitlementsService } from './billing-entitlements.service';
import { BillingService } from './billing.service';
import { CreateCheckoutSessionDto, CreatePortalSessionDto } from './dto';
import { OwnershipGuard } from '../../common/guards';
import { CheckOwnership, CurrentUser, Public } from '../../common/decorators';
import { ok } from '../../common/utils/response.util';

@Controller('billing')
export class BillingController {
  constructor(
    private readonly billingService: BillingService,
    private readonly billingEntitlementsService: BillingEntitlementsService,
  ) {}

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

  @Get(':artistId/entitlements')
  @CheckOwnership('artist', 'artistId', 'read')
  @UseGuards(OwnershipGuard)
  async getEntitlements(@Param('artistId') artistId: string) {
    const entitlements = await this.billingEntitlementsService.getArtistEntitlements(artistId);
    return ok(entitlements);
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
