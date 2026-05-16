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
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import type { User } from '@prisma/client';
import { AdminAccessGuard, AdminOwnerGuard } from './admin-owner.guard';
import { AdminService } from './admin.service';
import {
  UpdateUserStatusDto,
  SendInvitationDto,
  UpdateUserDto,
  GrantAccessDto,
  ExtendAccessDto,
} from './dto';
import { CurrentUser } from '../../common/decorators';
import { extractClientIp } from '../../common/utils/request.utils';

/**
 * AdminController — Behind the Stage internal endpoints.
 *
 * All routes are protected by JwtAuthGuard (global APP_GUARD).
 * Read-only list access allows Behind owners/admins; mutations require owner.
 *
 * Routes:
 *   GET    /api/admin/users             → list registered users (excludes soft-deleted)
 *   PATCH  /api/admin/users/:id         → update firstName / lastName
 *   DELETE /api/admin/users/:id         → soft-delete (sets deletedAt)
 *   PATCH  /api/admin/users/:id/status  → suspend or unsuspend a user
 *   POST   /api/admin/invitations       → send WorkOS invitation email
 */
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  /** GET /api/admin/users */
  @Get('users')
  @UseGuards(AdminAccessGuard)
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
  @UseGuards(AdminOwnerGuard)
  @HttpCode(200)
  async updateUser(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser() actor: User,
    @Req() req: Request,
  ) {
    const user = await this.adminService.updateUser(
      id,
      dto.firstName,
      dto.lastName,
      actor.id,
      extractClientIp(req),
    );
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
  @UseGuards(AdminOwnerGuard)
  @HttpCode(204)
  async deleteUser(@Param('id') id: string, @CurrentUser() actor: User, @Req() req: Request) {
    await this.adminService.softDeleteUser(id, actor.id, extractClientIp(req));
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
  @UseGuards(AdminOwnerGuard)
  @HttpCode(201)
  async sendInvitation(
    @Body() dto: SendInvitationDto,
    @CurrentUser() actor: User,
    @Req() req: Request,
  ) {
    const invitation = await this.adminService.sendInvitation(
      dto.email,
      actor.id,
      extractClientIp(req),
    );
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
  @UseGuards(AdminOwnerGuard)
  @HttpCode(200)
  async updateUserStatus(
    @Param('id') id: string,
    @Body() dto: UpdateUserStatusDto,
    @CurrentUser() actor: User,
    @Req() req: Request,
  ) {
    const user = await this.adminService.updateUserStatus(
      id,
      dto.isSuspended,
      actor.id,
      extractClientIp(req),
    );
    return { user };
  }

  /**
   * POST /api/admin/users/:id/access
   *
   * Grants a temporary (admin-issued) PRO / PRO+ access to the user's
   * artist. Does NOT modify commercial billing (plan/status/stripe_*).
   * Body: { plan: 'pro' | 'pro_plus', expiresAt: ISO8601, reason?: string }
   */
  @Post('users/:id/access')
  @UseGuards(AdminOwnerGuard)
  @HttpCode(201)
  async grantAccess(
    @Param('id') id: string,
    @Body() dto: GrantAccessDto,
    @CurrentUser() actor: User,
    @Req() req: Request,
  ) {
    const subscription = await this.adminService.grantAccess(
      id,
      dto.plan,
      dto.expiresAt,
      dto.reason,
      actor.id,
      extractClientIp(req),
    );
    return { subscription };
  }

  /**
   * PATCH /api/admin/users/:id/access
   *
   * Extends (or shortens) an existing manual grant's expiry, optionally
   * updating the reason. Body: { expiresAt: ISO8601, reason?: string }
   */
  @Patch('users/:id/access')
  @UseGuards(AdminOwnerGuard)
  @HttpCode(200)
  async extendAccess(
    @Param('id') id: string,
    @Body() dto: ExtendAccessDto,
    @CurrentUser() actor: User,
    @Req() req: Request,
  ) {
    const subscription = await this.adminService.extendAccess(
      id,
      dto.expiresAt,
      dto.reason,
      actor.id,
      extractClientIp(req),
      dto.plan,
    );
    return { subscription };
  }

  /**
   * DELETE /api/admin/users/:id/access
   *
   * Revokes a manual grant (nulls all manualAccess* fields). Commercial
   * billing is untouched — the tenant falls back to their real plan.
   */
  @Delete('users/:id/access')
  @UseGuards(AdminOwnerGuard)
  @HttpCode(200)
  async revokeAccess(@Param('id') id: string, @CurrentUser() actor: User, @Req() req: Request) {
    const subscription = await this.adminService.revokeAccess(id, actor.id, extractClientIp(req));
    return { subscription };
  }
}
