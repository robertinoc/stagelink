import { Controller, Get } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * GET /api/auth/session
   * Returns current session status.
   * TODO: Implement with WorkOS AuthKit.
   */
  @Get('session')
  getSession() {
    return this.authService.getSession();
  }
}
