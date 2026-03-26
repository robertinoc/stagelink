import { Injectable } from '@nestjs/common';
import type { User } from '@prisma/client';
import { PrismaService } from '../../lib/prisma.service';
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
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Construye la respuesta para GET /api/auth/me.
   *
   * Incluye los artistIds del usuario para que el frontend pueda
   * resolver ownership sin hacer una segunda request.
   */
  async buildMeResponse(user: User): Promise<AuthenticatedUser> {
    // Cargar artistIds del usuario en una sola query
    const artists = await this.prisma.artist.findMany({
      where: { userId: user.id },
      select: { id: true },
    });

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      avatarUrl: user.avatarUrl,
      artistIds: artists.map((a) => a.id),
      createdAt: user.createdAt,
    };
  }
}
