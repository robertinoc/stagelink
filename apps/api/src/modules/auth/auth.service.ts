import { Injectable } from '@nestjs/common';
import type { User } from '@prisma/client';
import { MembershipService } from '../membership/membership.service';
import type { AuthenticatedUser } from './dto';

/**
 * AuthService — lógica de negocio del módulo de autenticación.
 *
 * El provisioning y validación de JWT ocurren en JwtAuthGuard.
 * Este servicio expone helpers para construir respuestas de sesión
 * y podrá extenderse con lógica de profile sync en el futuro.
 */
@Injectable()
export class AuthService {
  constructor(private readonly membershipService: MembershipService) {}

  /**
   * Construye la respuesta para GET /api/auth/me.
   *
   * Incluye los artistIds del usuario para que el frontend pueda
   * resolver ownership sin hacer una segunda request.
   * Usa MembershipService para obtener todos los artistas donde el usuario
   * tiene membresía (no solo los que creó directamente).
   */
  async buildMeResponse(user: User): Promise<AuthenticatedUser> {
    const artistIds = await this.membershipService.getArtistIdsForUser(user.id);

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      avatarUrl: user.avatarUrl,
      artistIds,
      isSuspended: user.isSuspended,
      createdAt: user.createdAt,
    };
  }
}
