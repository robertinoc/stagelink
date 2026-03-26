import { Controller, Get } from '@nestjs/common';
import type { User } from '@prisma/client';
import { CurrentUser } from '../../common/decorators';
import { AuthService } from './auth.service';
import type { AuthenticatedUser } from './dto';

/**
 * AuthController — endpoints de sesión del usuario autenticado.
 *
 * Todas las rutas de este controller requieren JWT válido
 * (por el APP_GUARD global). No se necesita @UseGuards() explícito.
 *
 * Rutas:
 *   GET /api/auth/me  →  datos del usuario autenticado + artistIds
 */
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * GET /api/auth/me
   *
   * Retorna el perfil del usuario autenticado con sus artistIds.
   * Útil para que el frontend inicialice el estado de sesión después del login.
   *
   * @returns AuthenticatedUser (nunca expone workosId ni tokens)
   */
  @Get('me')
  getMe(@CurrentUser() user: User): Promise<AuthenticatedUser> {
    return this.authService.buildMeResponse(user);
  }
}
