import { Controller, Get, Patch, Post, Param, Body, UseGuards, HttpCode } from '@nestjs/common';
import { AdminOwnerGuard } from './admin-owner.guard';
import { AdminService } from './admin.service';
import { UpdateUserStatusDto, SendInvitationDto } from './dto';

/**
 * AdminController — Behind the Stage internal endpoints.
 *
 * All routes are protected by JwtAuthGuard (global APP_GUARD) +
 * AdminOwnerGuard (applied at controller level).
 *
 * Routes:
 *   GET   /api/admin/users             → list all registered users
 *   PATCH /api/admin/users/:id/status  → suspend or unsuspend a user
 *   POST  /api/admin/invitations       → send WorkOS invitation email
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
