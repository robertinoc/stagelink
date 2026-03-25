import { Injectable } from '@nestjs/common';

@Injectable()
export class AuthService {
  /**
   * Returns the current session status.
   * TODO: Validate WorkOS session token from request.
   */
  getSession() {
    return {
      authenticated: false,
      message: 'Auth stub — WorkOS integration pending',
    };
  }
}
