import { Module } from '@nestjs/common';
import { SmartLinksController } from './smart-links.controller';
import { SmartLinksService } from './smart-links.service';

/**
 * SmartLinksModule — authenticated CRUD for artist smart links.
 *
 * MembershipService, AuditService, and PrismaService are @Global().
 * No need to import their modules here.
 *
 * The public resolution endpoint lives in PublicModule to keep
 * it alongside the other unauthenticated public routes.
 */
@Module({
  controllers: [SmartLinksController],
  providers: [SmartLinksService],
  exports: [SmartLinksService],
})
export class SmartLinksModule {}
