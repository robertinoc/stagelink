import {
  Controller,
  Get,
  Patch,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  HttpCode,
} from '@nestjs/common';
import { AdminOwnerGuard } from './admin-owner.guard';
import { AdminService } from './admin.service';
import { UpdateUserStatusDto, SendInvitationDto, UpdateUserDto } from './dto';

/**
 * AdminController — Behind the Stage internal endpoints.
 *
 * All routes are protected by JwtAuthGuard (global APP_GUARD) +
 * AdminOwnerGuard (applied at controller level).
 *
 * Routes:
 *   GET    /api/admin/users             → list registered users (excludes soft-deleted)
 *   PATCH  /api/admin/users/:id         → update firstName / lastName
 *   DELETE /api/admin/users/:id         → soft-delete (sets deletedAt)
 *   PATCH  /api/admin/users/:id/status  → suspend or unsuspend a user
 *   POST   /api/admin/invitations       → send WorkOS invitation email
 */
@Controller('admin')
@UseGuards(AdminOwnerGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  /** GET /api/admin/users */
  @Get('users')
  async listUsers() {
    const users = await this.adminService.listUsers();
    return { users };
  }

  /**
   * PATCH /api/admin/users/:id
   *
   * Editable: firstName, lastName.
   * Not editable: email (WorkOS identity), handle (Artist.username — immutable).
   */
  @Patch('users/:id')
  @HttpCode(200)
  async updateUser(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    const user = await this.adminService.updateUser(id, dto.firstName, dto.lastName);
    return { user };
  }

  /**
   * DELETE /api/admin/users/:id
   *
   * Soft-delete: sets deletedAt = now(). User disappears from default list.
   * Hard delete is deferred to V2 due to FK constraints on Asset.createdByUserId.
   * WorkOS identity remains; auth layers (layout + onboarding) block access.
   */
  @Delete('users/:id')
  @HttpCode(204)
  async deleteUser(@Param('id') id: string) {
    await this.adminService.softDeleteUser(id);
  }

  /**
   * POST /api/admin/invitations
   *
   * Body: { "email": "someone@example.com" }
   *
   * Sends a WorkOS invitation so the user can sign up via the existing
   * OAuth/magic-link flow. Returns the WorkOS invitation id and expiry.
   */
  @Post('invitations')
  @HttpCode(201)
  async sendInvitation(@Body() dto: SendInvitationDto) {
    const invitation = await this.adminService.sendInvitation(dto.email);
    return { invitation };
  }

  /**
   * PATCH /api/admin/users/:id/status
   *
   * Body: { "isSuspended": true | false }
   *
   * Safety checks (enforced in AdminService):
   *   - Target user must exist → 404
   *   - Target must not be an owner email → 403
   *
   * Returns the updated user summary.
   */
  @Patch('users/:id/status')
  @HttpCode(200)
  async updateUserStatus(@Param('id') id: string, @Body() dto: UpdateUserStatusDto) {
    const user = await this.adminService.updateUserStatus(id, dto.isSuspended);
    return { user };
  }
}
