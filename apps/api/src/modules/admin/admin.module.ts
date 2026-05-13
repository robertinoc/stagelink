import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminAccessGuard, AdminOwnerGuard } from './admin-owner.guard';
import { AdminRoleService } from './admin-role.service';
import { AdminService } from './admin.service';

@Module({
  controllers: [AdminController],
  providers: [AdminAccessGuard, AdminOwnerGuard, AdminRoleService, AdminService],
})
export class AdminModule {}
