import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import { AdminAccessGuard, AdminOwnerGuard } from './admin-owner.guard';
import type { AdminRoleService } from './admin-role.service';

function createContext(user?: { email: string }): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ user }),
    }),
  } as unknown as ExecutionContext;
}

describe('admin guards', () => {
  it('allows read access for dynamic admins', async () => {
    const roles = { hasAccess: jest.fn().mockResolvedValue(true) } as unknown as AdminRoleService;
    const guard = new AdminAccessGuard(roles);

    await expect(guard.canActivate(createContext({ email: 'admin@example.com' }))).resolves.toBe(
      true,
    );
  });

  it('requires authentication before checking admin access', async () => {
    const roles = { hasAccess: jest.fn() } as unknown as AdminRoleService;
    const guard = new AdminAccessGuard(roles);

    await expect(guard.canActivate(createContext())).rejects.toThrow(UnauthorizedException);
    expect(roles.hasAccess).not.toHaveBeenCalled();
  });

  it('rejects read access for users without a Behind role', async () => {
    const roles = { hasAccess: jest.fn().mockResolvedValue(false) } as unknown as AdminRoleService;
    const guard = new AdminAccessGuard(roles);

    await expect(guard.canActivate(createContext({ email: 'artist@example.com' }))).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('rejects mutations for non-owner admins', async () => {
    const roles = { isOwner: jest.fn().mockResolvedValue(false) } as unknown as AdminRoleService;
    const guard = new AdminOwnerGuard(roles);

    await expect(guard.canActivate(createContext({ email: 'admin@example.com' }))).rejects.toThrow(
      ForbiddenException,
    );
  });
});
