import { Module } from '@nestjs/common';
import { EmailModule } from '../email/email.module';
import { AdminController } from './admin.controller';
import { AdminAccessGuard, AdminOwnerGuard } from './admin-owner.guard';
import { AdminRoleService } from './admin-role.service';
import { AdminService } from './admin.service';

@Module({
  imports: [EmailModule],
  controllers: [AdminController],
  providers: [AdminAccessGuard, AdminOwnerGuard, AdminRoleService, AdminService],
})
export class AdminModule {}
