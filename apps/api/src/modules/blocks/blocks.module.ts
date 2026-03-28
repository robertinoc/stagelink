import { Module } from '@nestjs/common';
import { BlocksController, PagesBlocksController } from './blocks.controller';
import { BlocksService } from './blocks.service';

/**
 * BlocksModule
 *
 * MembershipService and AuditService are @Global() — PrismaModule too.
 * No need to import their modules here.
 */
@Module({
  controllers: [BlocksController, PagesBlocksController],
  providers: [BlocksService],
  exports: [BlocksService],
})
export class BlocksModule {}
