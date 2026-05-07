import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import type { User } from '@prisma/client';
import { IS_PUBLIC_KEY, OWNERSHIP_KEY, type OwnershipMeta } from '../decorators';
import { PrismaService } from '../../lib/prisma.service';
import { MembershipService } from '../../modules/membership/membership.service';
import { getWorkOS } from '../../lib/workos';
import { requireActiveAuthUser } from './auth-user-status';

/**
 * JwtAuthGuard — guard global de autenticación.
 *
 * Flujo por request:
 *  1. Rutas marcadas @Public() → pasan sin validación
 *  2. Extrae Bearer token del header Authorization
 *  3. Valida el JWT contra el JWKS endpoint de WorkOS
 *  4. Extrae sub (WorkOS User ID) del payload
 *  5. Busca el User interno en DB por workos_id
 *     a. Si no existe → provisiona desde WorkOS API (solo primer login)
 *     b. Si existe → usa registro de DB directamente
 *  6. Adjunta User a request.user
 *
 * Seguridad:
 * - La validación es local (JWKS cacheado, sin round-trip a WorkOS por request)
 * - request.user siempre viene de la DB interna, nunca del payload del cliente
 * - El WorkOS API call solo ocurre en el primer login del usuario
 *
 * Registrado como APP_GUARD global en AppModule.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  private readonly logger = new Logger(JwtAuthGuard.name);
  private readonly jwks: ReturnType<typeof createRemoteJWKSet>;

  constructor(
    private readonly reflector: Reflector,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const clientId = this.configService.getOrThrow<string>('workos.clientId');
    // WorkOS AuthKit access tokens are signed by the SSO JWKS for the client.
    // Docs: https://workos.com/docs/user-management/sessions/introduction
    const jwksUrl = `https://api.workos.com/sso/jwks/${clientId}`;
    this.jwks = createRemoteJWKSet(new URL(jwksUrl));
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Opt-out: rutas marcadas como @Public() pasan sin autenticación
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<Request & { user?: User }>();
    const token = extractBearerToken(request);

    if (!token) {
      throw new UnauthorizedException('Missing Authorization header');
    }

    // Validar JWT localmente (JWKS cacheado por jose)
    let workosUserId: string;
    try {
      const { payload } = await jwtVerify(token, this.jwks);
      if (!payload.sub) throw new Error('JWT missing sub claim');
      workosUserId = payload.sub;
    } catch (err) {
      this.logger.error(
        `JWT validation failed: ${err instanceof Error ? err.message : String(err)}`,
      );
      throw new UnauthorizedException('Invalid or expired token');
    }

    // Resolver usuario interno — crear si es el primer login
    const user = await this.resolveUser(workosUserId);
    request.user = user;
    return true;
  }

  /**
   * Resuelve el User interno de StageLink a partir del WorkOS User ID.
   *
   * - Si el User ya existe en DB: lookup directo (O(1), sin llamadas externas)
   * - Si no existe: primer login → fetch de perfil WorkOS + creación en DB
   *
   * Caso especial — rotación de WorkOS User ID (ej. migración de dominio):
   * Si el workosId no existe pero el email sí, el WorkOS ID cambió para el mismo
   * usuario real (nueva app/org de WorkOS). En ese caso actualizamos workosId en el
   * registro existente en lugar de crear un ghost user sin artist memberships.
   *
   * El upsert garantiza idempotencia aunque dos requests paralelas
   * del mismo usuario nuevo lleguen simultáneamente.
   */
  private async resolveUser(workosUserId: string): Promise<User> {
    // Fast path: usuario ya provisionado (majority of requests)
    const existing = await this.prisma.user.findUnique({
      where: { workosId: workosUserId },
    });
    if (existing) return requireActiveAuthUser(existing);

    // Slow path: primer login — obtener perfil desde WorkOS
    try {
      const workos = getWorkOS();
      const workosUser = await workos.userManagement.getUser(workosUserId);

      // Email fallback: handles workosId rotation after domain/app migration.
      // If a User row already exists with this email but a different workosId,
      // reconnect it to the new workosId instead of creating a ghost user that
      // has no ArtistMemberships and would send the user through onboarding again.
      const byEmail = await this.prisma.user.findUnique({
        where: { email: workosUser.email },
      });
      if (byEmail) {
        this.logger.warn(
          `WorkOS ID changed for ${workosUser.email}: ${byEmail.workosId} → ${workosUserId}. Reconnecting existing user.`,
        );
        const reconnectedUser = await this.prisma.user.update({
          where: { id: byEmail.id },
          data: { workosId: workosUserId },
        });
        return requireActiveAuthUser(reconnectedUser);
      }

      // Truly new user — upsert para manejar race conditions
      // (dos requests paralelas del mismo usuario nuevo)
      return await this.prisma.user.upsert({
        where: { workosId: workosUserId },
        create: {
          workosId: workosUserId,
          email: workosUser.email,
          firstName: workosUser.firstName ?? null,
          lastName: workosUser.lastName ?? null,
          avatarUrl: workosUser.profilePictureUrl ?? null,
        },
        update: {
          // Si por algún motivo el registro existe en este punto,
          // no sobreescribimos datos existentes (evitamos race condition)
        },
      });
    } catch (err) {
      this.logger.error(
        `Failed to provision user ${workosUserId}: ${err instanceof Error ? err.message : String(err)}`,
      );
      // No dejar pasar requests si no podemos provisionar el usuario
      throw new UnauthorizedException('Unable to resolve user');
    }
  }
}

/**
 * OwnershipGuard — verifica que request.user sea miembro del artista
 * con el nivel de acceso requerido.
 *
 * Requiere que el endpoint esté decorado con @CheckOwnership(resource, param, access?).
 * Sin ese decorator, el guard rechaza el request por defecto (fail-closed).
 *
 * Flujo:
 *   1. Lee metadata de @CheckOwnership
 *   2. Extrae el param del request
 *   3. Llama membershipService.resolveArtistIdForResource(resource, paramValue) → artistId
 *   4. Si no existe → 404 (no revela si el recurso existe en otro tenant)
 *   5. Llama membershipService.validateAccess(userId, artistId, access) → lanza 403 si insuficiente
 *
 * Uso:
 *   @CheckOwnership('page', 'pageId', 'write')
 *   @UseGuards(OwnershipGuard)
 */
@Injectable()
export class OwnershipGuard implements CanActivate {
  private readonly logger = new Logger(OwnershipGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly membershipService: MembershipService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const meta = this.reflector.getAllAndOverride<OwnershipMeta | undefined>(OWNERSHIP_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Fail-closed: si no hay metadata de ownership configurada, denegar.
    if (!meta) {
      this.logger.error(
        'OwnershipGuard applied without @CheckOwnership decorator — denying by default',
      );
      throw new ForbiddenException('Ownership check misconfigured');
    }

    const request = context.switchToHttp().getRequest<Request & { user?: User }>();
    const user = request.user;

    // JwtAuthGuard corre antes (APP_GUARD global), user siempre debe estar presente
    if (!user) throw new UnauthorizedException('Not authenticated');

    const paramValue = (request as unknown as { params: Record<string, string> }).params[
      meta.param
    ];
    if (!paramValue) {
      throw new ForbiddenException(`Missing route param: ${meta.param}`);
    }

    // Resolve to artistId
    const artistId = await this.membershipService.resolveArtistIdForResource(
      meta.resource,
      paramValue,
    );

    if (!artistId) {
      throw new NotFoundException(`${meta.resource} not found`);
    }

    // validateAccess throws 404/403 as appropriate
    await this.membershipService.validateAccess(user.id, artistId, meta.access ?? 'read');

    return true;
  }
}

// ─── re-exports ──────────────────────────────────────────────────────────────

export { PublicRateLimitGuard } from './public-rate-limit.guard';
export { UploadRateLimitGuard } from './upload-rate-limit.guard';

// ─── helpers ─────────────────────────────────────────────────────────────────

function extractBearerToken(request: Request): string | null {
  const authHeader = request.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7).trim();
  return token.length > 0 ? token : null;
}
