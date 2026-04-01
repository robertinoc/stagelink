import { Module } from '@nestjs/common';
import { BlocksController, PagesBlocksController } from './blocks.controller';
import { BlocksService } from './blocks.service';
import { SmartLinksModule } from '../smart-links/smart-links.module';

/**
 * BlocksModule
 *
 * Imports SmartLinksModule to access SmartLinksService.verifySmartLinkOwnership,
 * which enforces that smartLinkId references in 'links' blocks belong to the
 * same artist — prevents cross-tenant IDOR when a user embeds another artist's
 * SmartLink in their own block.
 *
 * MembershipService and AuditService are @Global() — PrismaModule too.
 * No need to import their modules here.
 */
@Module({
  imports: [SmartLinksModule],
  controllers: [BlocksController, PagesBlocksController],
  providers: [BlocksService],
  exports: [BlocksService],
})
export class BlocksModule {}
