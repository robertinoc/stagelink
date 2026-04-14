import { Body, Controller, Get, Param, Patch, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import type { User } from '@prisma/client';
import type { ShopifyConnection, ShopifyConnectionValidationResult } from '@stagelink/types';
import { CurrentUser } from '../../common/decorators';
import { extractClientIp } from '../../common/utils/request.utils';
import { ShopifyService } from './shopify.service';
import { UpdateShopifyConnectionDto, ValidateShopifyConnectionDto } from './dto';

@Controller('artists/:artistId/shopify')
export class ShopifyController {
  constructor(private readonly shopifyService: ShopifyService) {}

  @Get()
  getConnection(
    @Param('artistId') artistId: string,
    @CurrentUser() user: User,
  ): Promise<ShopifyConnection> {
    return this.shopifyService.getConnection(artistId, user.id);
  }

  @Post('validate')
  validateConnection(
    @Param('artistId') artistId: string,
    @Body() dto: ValidateShopifyConnectionDto,
    @CurrentUser() user: User,
  ): Promise<ShopifyConnectionValidationResult> {
    return this.shopifyService.validateConnection(artistId, dto, user.id);
  }

  @Patch()
  updateConnection(
    @Param('artistId') artistId: string,
    @Body() dto: UpdateShopifyConnectionDto,
    @CurrentUser() user: User,
    @Req() req: Request,
  ): Promise<ShopifyConnection> {
    return this.shopifyService.updateConnection(artistId, dto, user.id, extractClientIp(req));
  }
}
