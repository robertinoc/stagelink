import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../lib/prisma.service';
import { getWorkOS } from '../../lib/workos';

/** Owner emails — kept in sync with admin-owner.guard.ts */
const BEHIND_OWNER_EMAILS: readonly string[] = ['robertinoc@gmail.com'];

export interface AdminUserDto {
  id: string;
  email: string;
  name: string | null;
  artistUsernames: string[];
  isSuspended: boolean;
  createdAt: Date;
}

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Returns all registered users, newest first.
   * Explicitly selects only safe fields — workosId is never included.
   */
  async listUsers(): Promise<AdminUserDto[]> {
    const rows = await this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isSuspended: true,
        createdAt: true,
        artists: { select: { username: true } },
      },
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
  async updateUserStatus(targetId: string, isSuspended: boolean): Promise<AdminUserDto> {
    const existing = await this.prisma.user.findUnique({
      where: { id: targetId },
      select: { id: true, email: true },
    });

    if (!existing) {
      throw new NotFoundException(`User ${targetId} not found`);
    }

    if (BEHIND_OWNER_EMAILS.includes(existing.email.toLowerCase())) {
      throw new ForbiddenException('Owner accounts cannot be suspended');
    }

    const updated = await this.prisma.user.update({
      where: { id: targetId },
      data: { isSuspended },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isSuspended: true,
        createdAt: true,
        artists: { select: { username: true } },
      },
    });

    return toDto(updated);
  }

  /**
   * Sends a WorkOS invitation email to the given address.
   * Returns the invitation object from WorkOS.
   * Throws BadRequestException if the email already has an active user.
   */
  async sendInvitation(
    email: string,
  ): Promise<{ id: string; email: string; expiresAt: string | null }> {
    const wos = getWorkOS();

    const existingUser = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: { id: true },
    });

    if (existingUser) {
      throw new BadRequestException('A user with this email already exists');
    }

    const invitation = await wos.userManagement.sendInvitation({ email });

    return {
      id: invitation.id,
      email: invitation.email,
      expiresAt: invitation.expiresAt ?? null,
    };
  }
}

// ─── helpers ────────────────────────────────────────────────────────────────

type UserRow = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  isSuspended: boolean;
  createdAt: Date;
  artists: { username: string }[];
};

function toDto(u: UserRow): AdminUserDto {
  return {
    id: u.id,
    email: u.email,
    name: formatName(u.firstName, u.lastName),
    artistUsernames: u.artists.map((a) => a.username),
    isSuspended: u.isSuspended,
    createdAt: u.createdAt,
  };
}

function formatName(first: string | null, last: string | null): string | null {
  const parts = [first, last].filter(Boolean);
  return parts.length > 0 ? parts.join(' ') : null;
}
