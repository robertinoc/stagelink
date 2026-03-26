import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import type { User } from '@prisma/client';
import { IS_PUBLIC_KEY } from '../decorators';
import { PrismaService } from '../../lib/prisma.service';
import { getWorkOS } from '../../lib/workos';

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
    // WorkOS JWKS endpoint para User Management (AuthKit)
    const jwksUrl = `https://api.workos.com/user_management/jwks/${clientId}`;
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
      this.logger.debug(
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
   * El upsert garantiza idempotencia aunque dos requests paralelas
   * del mismo usuario nuevo lleguen simultáneamente.
   */
  private async resolveUser(workosUserId: string): Promise<User> {
    // Fast path: usuario ya provisionado (majority of requests)
    const existing = await this.prisma.user.findUnique({
      where: { workosId: workosUserId },
    });
    if (existing) return existing;

    // Slow path: primer login — obtener perfil desde WorkOS
    try {
      const workos = getWorkOS();
      const workosUser = await workos.userManagement.getUser(workosUserId);

      // Upsert para manejar race conditions (dos requests paralelas del mismo usuario nuevo)
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
 * OwnershipGuard — verifica que request.user sea dueño del recurso.
 *
 * Implementación completa en T2+:
 * - leer artistId del route param
 * - comparar con user.artists[].id
 *
 * Uso combinado:
 *   @UseGuards(OwnershipGuard)
 *   @Get(':artistId/pages')
 */
@Injectable()
export class OwnershipGuard implements CanActivate {
  canActivate(_context: ExecutionContext): boolean {
    // TODO (T2+): Check resource ownership against request.user.artists
    return true;
  }
}

// ─── helpers ─────────────────────────────────────────────────────────────────

function extractBearerToken(request: Request): string | null {
  const authHeader = request.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7).trim();
  return token.length > 0 ? token : null;
}
