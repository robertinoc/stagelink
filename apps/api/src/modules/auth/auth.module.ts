import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

/**
 * AuthModule — sesión y perfil del usuario autenticado.
 *
 * El JwtAuthGuard se registra como APP_GUARD global en AppModule
 * (no aquí) para que aplique a todos los módulos sin importar AuthModule
 * explícitamente en cada uno.
 */
@Module({
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
