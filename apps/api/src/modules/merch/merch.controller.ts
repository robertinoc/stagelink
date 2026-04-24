import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req } from '@nestjs/common';
import type { Request } from 'express';
import type { User } from '@prisma/client';
import type {
  MerchConnectionValidationResult,
  MerchProviderConnection,
  SmartMerchProduct,
} from '@stagelink/types';
import { CurrentUser } from '../../common/decorators';
import { extractClientIp } from '../../common/utils/request.utils';
import {
  ListMerchProductsQueryDto,
  UpdateMerchConnectionDto,
  ValidateMerchConnectionDto,
} from './dto';
import { MerchService } from './merch.service';

@Controller('artists/:artistId/merch')
export class MerchController {
  constructor(private readonly merchService: MerchService) {}

  @Get()
  getConnection(
    @Param('artistId') artistId: string,
    @CurrentUser() user: User,
  ): Promise<MerchProviderConnection> {
    return this.merchService.getConnection(artistId, user.id);
  }

  @Get('products')
  listProducts(
    @Param('artistId') artistId: string,
    @Query() query: ListMerchProductsQueryDto,
    @CurrentUser() user: User,
  ): Promise<SmartMerchProduct[]> {
    return this.merchService.listAvailableProducts(artistId, user.id, query.limit);
  }

  @Post('validate')
  validateConnection(
    @Param('artistId') artistId: string,
    @Body() dto: ValidateMerchConnectionDto,
    @CurrentUser() user: User,
  ): Promise<MerchConnectionValidationResult> {
    return this.merchService.validateConnection(artistId, dto, user.id);
  }

  @Patch()
  updateConnection(
    @Param('artistId') artistId: string,
    @Body() dto: UpdateMerchConnectionDto,
    @CurrentUser() user: User,
    @Req() req: Request,
  ): Promise<MerchProviderConnection> {
    return this.merchService.updateConnection(artistId, dto, user.id, extractClientIp(req));
  }

  @Delete()
  disconnectConnection(
    @Param('artistId') artistId: string,
    @CurrentUser() user: User,
    @Req() req: Request,
  ): Promise<MerchProviderConnection> {
    return this.merchService.disconnectConnection(artistId, user.id, extractClientIp(req));
  }
}
