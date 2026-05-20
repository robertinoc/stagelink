import {
  BadRequestException,
  ConflictException,
  Injectable,
  ForbiddenException,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Prisma, PlanTier } from '@prisma/client';
import { PrismaService } from '../../lib/prisma.service';
import { getWorkOS } from '../../lib/workos';
import { isBehindOwnerEmail } from './admin.config';
import { AuditService } from '../audit/audit.service';
import { EmailService } from '../email/email.service';
import {
  resolveEffectiveAccess,
  type AccessSource,
  type BillingSubscriptionStatus,
  type PlanCode,
} from '@stagelink/types';

export interface AdminSubscriptionDto {
  /** Commercial (Stripe-backed) plan. Never mutated by manual grants. */
  plan: PlanCode;
  status: BillingSubscriptionStatus;
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd: string | null;
  manualAccessPlan: PlanCode | null;
  manualAccessStartsAt: string | null;
  manualAccessExpiresAt: string | null;
  manualAccessReason: string | null;
  manualAccessGrantedBy: string | null;
  isManualGrantActive: boolean;
  effectiveAccess: PlanCode;
  accessSource: AccessSource;
}

export interface AdminUserDto {
  id: string;
  email: string;
  name: string | null;
  artistUsernames: string[];
  isSuspended: boolean;
  createdAt: Date;
  firstName: string | null;
  lastName: string | null;
  /** First artist's subscription/access summary. null if no artist/subscription. */
  subscription: AdminSubscriptionDto | null;
}

/**
 * Shared Prisma `select` for every admin user query. Keeps the row shape
 * (and therefore the DTO mapping) identical across list/update/suspend.
 * workosId is never selected.
 */
const ADMIN_SUBSCRIPTION_SELECT = {
  plan: true,
  status: true,
  currentPeriodEnd: true,
  cancelAtPeriodEnd: true,
  manualAccessPlan: true,
  manualAccessStartsAt: true,
  manualAccessExpiresAt: true,
  manualAccessReason: true,
  manualAccessGrantedBy: true,
} as const;

const ADMIN_USER_SELECT = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  isSuspended: true,
  deletedAt: true,
  createdAt: true,
  artists: {
    select: {
      username: true,
      subscription: { select: ADMIN_SUBSCRIPTION_SELECT },
    },
  },
} as const;

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly emailService: EmailService,
  ) {}

  /**
   * Returns all registered users, newest first.
   * Explicitly selects only safe fields — workosId is never included.
   */
  async listUsers(): Promise<AdminUserDto[]> {
    const rows = await this.prisma.user.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
      select: ADMIN_USER_SELECT,
    });

    return rows.map(toDto);
  }

  /**
   * Toggles isSuspended for a user.
   *
   * Safety checks (in order):
   *   1. Target user must exist → 404
   *   2. Target email must not be an owner email → 403
   *      (prevents self-suspension and suspending any co-owner)
   */
  async updateUserStatus(
    targetId: string,
    isSuspended: boolean,
    actorId: string,
    ipAddress?: string,
  ): Promise<AdminUserDto> {
    const existing = await this.prisma.user.findUnique({
      where: { id: targetId },
      select: { id: true, email: true, deletedAt: true },
    });

    if (!existing || existing.deletedAt !== null) {
      throw new NotFoundException(`User ${targetId} not found`);
    }

    if (isBehindOwnerEmail(existing.email)) {
      throw new ForbiddenException('Owner accounts cannot be suspended');
    }

    const updated = await this.prisma.user.update({
      where: { id: targetId },
      data: { isSuspended },
      select: ADMIN_USER_SELECT,
    });

    this.auditService.log({
      actorId,
      action: isSuspended ? 'admin.user.suspend' : 'admin.user.unsuspend',
      entityType: 'user',
      entityId: targetId,
      metadata: { targetEmail: existing.email },
      ipAddress,
    });

    return toDto(updated);
  }

  /**
   * Updates mutable profile fields for a user.
   *
   * Only firstName and lastName are editable via admin:
   *   - email syncs from WorkOS on login — editing locally would desync identity
   *   - handle lives on Artist.username — immutable by design
   *   - isSuspended is handled by updateUserStatus()
   *   - deletedAt is handled by softDeleteUser()
   */
  async updateUser(
    targetId: string,
    firstName: string | undefined,
    lastName: string | undefined,
    actorId: string,
    ipAddress?: string,
  ): Promise<AdminUserDto> {
    const existing = await this.prisma.user.findUnique({
      where: { id: targetId },
      select: { id: true, email: true, deletedAt: true },
    });

    if (!existing || existing.deletedAt !== null) {
      throw new NotFoundException(`User ${targetId} not found`);
    }

    const updated = await this.prisma.user.update({
      where: { id: targetId },
      data: {
        ...(firstName !== undefined && { firstName: firstName.trim() || null }),
        ...(lastName !== undefined && { lastName: lastName.trim() || null }),
      },
      select: ADMIN_USER_SELECT,
    });

    this.auditService.log({
      actorId,
      action: 'admin.user.update',
      entityType: 'user',
      entityId: targetId,
      metadata: {
        targetEmail: existing.email,
        fields: [
          ...(firstName !== undefined ? ['firstName'] : []),
          ...(lastName !== undefined ? ['lastName'] : []),
        ],
      },
      ipAddress,
    });

    return toDto(updated);
  }

  /**
   * Soft-deletes a user by setting deletedAt = now().
   *
   * Hard delete is intentionally deferred (V2):
   *   - Asset.createdByUserId has no onDelete clause → Postgres Restrict
   *     would block deletion for any user with uploaded assets.
   *   - Soft delete is safe, reversible, and preserves audit history.
   *   - WorkOS identity remains active; future V2 will call
   *     wos.userManagement.deleteUser() to fully revoke access.
   *
   * The user's data (artists, pages, subscribers) is preserved in DB.
   * Auth enforcement in layout.tsx and onboarding/page.tsx blocks access.
   */
  async softDeleteUser(targetId: string, actorId: string, ipAddress?: string): Promise<void> {
    const existing = await this.prisma.user.findUnique({
      where: { id: targetId },
      select: { id: true, email: true, deletedAt: true },
    });

    if (!existing || existing.deletedAt !== null) {
      throw new NotFoundException(`User ${targetId} not found`);
    }

    if (isBehindOwnerEmail(existing.email)) {
      throw new ForbiddenException('Owner accounts cannot be deleted');
    }

    await this.prisma.user.update({
      where: { id: targetId },
      data: { deletedAt: new Date() },
    });

    this.auditService.log({
      actorId,
      action: 'admin.user.soft_delete',
      entityType: 'user',
      entityId: targetId,
      metadata: { targetEmail: existing.email },
      ipAddress,
    });
  }

  /**
   * Sends a WorkOS invitation email to the given address.
   * Returns the invitation object from WorkOS.
   * Throws BadRequestException if the email already has an active user.
   */
  async sendInvitation(
    email: string,
    actorId: string,
    ipAddress?: string,
  ): Promise<{ id: string; email: string; expiresAt: string | null }> {
    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true },
    });

    if (existingUser) {
      throw new BadRequestException('A user with this email already exists');
    }

    try {
      const wos = getWorkOS();
      const existingInvitations = await wos.userManagement.listInvitations({
        email: normalizedEmail,
        limit: 10,
      });
      const pendingInvitation = existingInvitations.data.find(
        (invitation) =>
          invitation.email.toLowerCase() === normalizedEmail && invitation.state === 'pending',
      );

      const invitation = pendingInvitation
        ? await wos.userManagement.resendInvitation(pendingInvitation.id)
        : await wos.userManagement.sendInvitation({ email: normalizedEmail });

      this.auditService.log({
        actorId,
        action: pendingInvitation ? 'admin.invitation.resend' : 'admin.invitation.send',
        entityType: 'workos_invitation',
        entityId: invitation.id,
        metadata: { targetEmail: invitation.email },
        ipAddress,
      });

      return {
        id: invitation.id,
        email: invitation.email,
        expiresAt: invitation.expiresAt ?? null,
      };
    } catch (error) {
      throw this.mapWorkOSInvitationError(error);
    }
  }

  private mapWorkOSInvitationError(error: unknown): Error {
    if (error instanceof Error && 'status' in error) {
      const status = Number((error as { status?: unknown }).status);
      if (status === 409) {
        return new ConflictException('Invitation already exists or cannot be resent yet');
      }
      if (status >= 400 && status < 500) {
        return new BadRequestException('Invitation could not be sent');
      }
      if (status >= 500) {
        return new ServiceUnavailableException('WorkOS invitation service is unavailable');
      }
    }

    if (error instanceof Error && error.message.includes('WORKOS_API_KEY')) {
      return new ServiceUnavailableException('WorkOS invitation service is not configured');
    }

    return new ServiceUnavailableException('Invitation service is unavailable');
  }

  // ─── Manual (admin-granted) temporary access ──────────────────────────────
  //
  // These never touch `plan`, `status` or any `stripe_*` column. They only
  // raise a tenant's access for a bounded window. The effective access is
  // recomputed via resolveEffectiveAccess() wherever it is consumed.

  private readonly MAX_GRANT_MS = 365 * 24 * 60 * 60 * 1000; // 1 year

  /**
   * Resolves the (single) artist + subscription for a target user.
   * Throws 404 if the user or an artist is missing.
   */
  private async resolveArtistForUser(targetUserId: string): Promise<{
    artistId: string;
    targetEmail: string;
    subscriptionId: string | null;
  }> {
    const user = await this.prisma.user.findUnique({
      where: { id: targetUserId },
      select: {
        email: true,
        deletedAt: true,
        artists: {
          select: { id: true, subscription: { select: { id: true } } },
        },
      },
    });

    if (!user || user.deletedAt !== null) {
      throw new NotFoundException(`User ${targetUserId} not found`);
    }

    const artist = user.artists[0];
    if (!artist) {
      throw new BadRequestException('User has no artist to grant access to');
    }

    return {
      artistId: artist.id,
      targetEmail: user.email,
      subscriptionId: artist.subscription?.id ?? null,
    };
  }

  /** Parses + validates an ISO expiry: must be in the future, max 1 year out. */
  private parseExpiry(expiresAt: string): Date {
    const expiry = new Date(expiresAt);
    if (Number.isNaN(expiry.getTime())) {
      throw new BadRequestException('expiresAt is not a valid date');
    }
    const now = Date.now();
    if (expiry.getTime() <= now) {
      throw new BadRequestException('expiresAt must be in the future');
    }
    if (expiry.getTime() - now > this.MAX_GRANT_MS) {
      throw new BadRequestException('expiresAt cannot be more than 1 year from now');
    }
    return expiry;
  }

  /**
   * Grants (or replaces) a manual temporary access for a tenant.
   * Upserts the subscription row WITHOUT changing commercial billing fields.
   */
  async grantAccess(
    targetUserId: string,
    plan: typeof PlanTier.pro | typeof PlanTier.pro_plus,
    expiresAt: string,
    reason: string | undefined,
    actorId: string,
    ipAddress?: string,
  ): Promise<AdminSubscriptionDto> {
    // Defensive runtime guard (the DTO already excludes `free` at the type level).
    if ((plan as PlanTier) === PlanTier.free) {
      throw new BadRequestException('Cannot grant the free plan');
    }
    const expiry = this.parseExpiry(expiresAt);
    const { artistId, targetEmail } = await this.resolveArtistForUser(targetUserId);
    const now = new Date();

    const manualData = {
      manualAccessPlan: plan,
      manualAccessStartsAt: now,
      manualAccessExpiresAt: expiry,
      manualAccessReason: reason?.trim() || null,
      manualAccessGrantedBy: actorId,
    };

    const sub = await this.prisma.subscription.upsert({
      where: { artistId },
      // create only sets manual fields — commercial fields keep their defaults
      create: { artistId, ...manualData },
      // update touches ONLY the manual fields
      update: manualData,
      select: ADMIN_SUBSCRIPTION_SELECT,
    });

    this.auditService.log({
      actorId,
      action: 'admin.access.grant',
      entityType: 'subscription',
      entityId: artistId,
      metadata: {
        targetUserId,
        targetEmail,
        plan,
        expiresAt: expiry.toISOString(),
        reason: reason ?? null,
      },
      ipAddress,
    });

    // Fire-and-forget email notification (never throws).
    void this.emailService.sendManualAccessGranted(targetEmail, plan, expiry);

    return mapSubscription(sub)!;
  }

  /**
   * Extends (or shortens) the expiry of an existing manual grant,
   * optionally updating the reason and optionally changing the granted plan.
   */
  async extendAccess(
    targetUserId: string,
    expiresAt: string,
    reason: string | undefined,
    actorId: string,
    ipAddress?: string,
    plan?: typeof PlanTier.pro | typeof PlanTier.pro_plus,
  ): Promise<AdminSubscriptionDto> {
    const expiry = this.parseExpiry(expiresAt);
    const { artistId, targetEmail } = await this.resolveArtistForUser(targetUserId);

    const current = await this.prisma.subscription.findUnique({
      where: { artistId },
      select: { manualAccessPlan: true },
    });

    if (!current || current.manualAccessPlan === null) {
      throw new BadRequestException('No active manual grant to extend');
    }

    const sub = await this.prisma.subscription.update({
      where: { artistId },
      data: {
        manualAccessExpiresAt: expiry,
        ...(reason !== undefined && { manualAccessReason: reason.trim() || null }),
        ...(plan !== undefined && { manualAccessPlan: plan }),
      },
      select: ADMIN_SUBSCRIPTION_SELECT,
    });

    this.auditService.log({
      actorId,
      action: 'admin.access.extend',
      entityType: 'subscription',
      entityId: artistId,
      metadata: {
        targetUserId,
        targetEmail,
        expiresAt: expiry.toISOString(),
        reason: reason ?? null,
        ...(plan !== undefined && { plan }),
      },
      ipAddress,
    });

    return mapSubscription(sub)!;
  }

  /**
   * Revokes a manual grant by nulling every manualAccess* field.
   * Commercial billing is untouched — the tenant falls back to their plan.
   */
  async revokeAccess(
    targetUserId: string,
    actorId: string,
    ipAddress?: string,
  ): Promise<AdminSubscriptionDto> {
    const { artistId, targetEmail } = await this.resolveArtistForUser(targetUserId);

    const current = await this.prisma.subscription.findUnique({
      where: { artistId },
      select: { manualAccessPlan: true },
    });

    if (!current) {
      throw new NotFoundException('No subscription found for this user');
    }

    const sub = await this.prisma.subscription.update({
      where: { artistId },
      data: {
        manualAccessPlan: null,
        manualAccessStartsAt: null,
        manualAccessExpiresAt: null,
        manualAccessReason: null,
        manualAccessGrantedBy: null,
      },
      select: ADMIN_SUBSCRIPTION_SELECT,
    });

    this.auditService.log({
      actorId,
      action: 'admin.access.revoke',
      entityType: 'subscription',
      entityId: artistId,
      metadata: { targetUserId, targetEmail },
      ipAddress,
    });

    // Fire-and-forget email notification (never throws).
    // current.manualAccessPlan is guaranteed non-null by the guard above.
    void this.emailService.sendManualAccessExpired(targetEmail, current.manualAccessPlan as string);

    return mapSubscription(sub)!;
  }
}

// ─── helpers ────────────────────────────────────────────────────────────────

type UserRow = Prisma.UserGetPayload<{ select: typeof ADMIN_USER_SELECT }>;
type SubscriptionRow = Prisma.SubscriptionGetPayload<{
  select: typeof ADMIN_SUBSCRIPTION_SELECT;
}> | null;

function mapSubscription(sub: SubscriptionRow): AdminSubscriptionDto | null {
  if (!sub) return null;

  const access = resolveEffectiveAccess(
    {
      plan: sub.plan as PlanCode,
      status: sub.status as BillingSubscriptionStatus,
      cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
      currentPeriodEnd: sub.currentPeriodEnd,
    },
    {
      manualAccessPlan: (sub.manualAccessPlan as PlanCode | null) ?? null,
      manualAccessStartsAt: sub.manualAccessStartsAt,
      manualAccessExpiresAt: sub.manualAccessExpiresAt,
      manualAccessReason: sub.manualAccessReason,
      manualAccessGrantedBy: sub.manualAccessGrantedBy,
    },
  );

  return {
    plan: sub.plan as PlanCode,
    status: sub.status as BillingSubscriptionStatus,
    cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
    currentPeriodEnd: sub.currentPeriodEnd?.toISOString() ?? null,
    manualAccessPlan: (sub.manualAccessPlan as PlanCode | null) ?? null,
    manualAccessStartsAt: sub.manualAccessStartsAt?.toISOString() ?? null,
    manualAccessExpiresAt: sub.manualAccessExpiresAt?.toISOString() ?? null,
    manualAccessReason: sub.manualAccessReason,
    manualAccessGrantedBy: sub.manualAccessGrantedBy,
    isManualGrantActive: access.isManualGrantActive,
    effectiveAccess: access.effectiveAccess,
    accessSource: access.accessSource,
  };
}

function toDto(u: UserRow): AdminUserDto {
  // Most users have a single artist; surface its subscription. Pick the
  // first artist that actually has a subscription row.
  const subRow =
    u.artists.find((a) => a.subscription != null)?.subscription ??
    u.artists[0]?.subscription ??
    null;

  return {
    id: u.id,
    email: u.email,
    name: formatName(u.firstName, u.lastName),
    firstName: u.firstName,
    lastName: u.lastName,
    artistUsernames: u.artists.map((a) => a.username),
    isSuspended: u.isSuspended,
    createdAt: u.createdAt,
    subscription: mapSubscription(subRow),
  };
}

function formatName(first: string | null, last: string | null): string | null {
  const parts = [first, last].filter(Boolean);
  return parts.length > 0 ? parts.join(' ') : null;
}
