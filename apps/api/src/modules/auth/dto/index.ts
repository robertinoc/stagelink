/**
 * Auth DTOs — WorkOS AuthKit flow.
 *
 * Note: WorkOS handles the OAuth redirect and callback automatically.
 * These DTOs are for internal session shape documentation only.
 * The actual JWT validation happens in JwtAuthGuard (T2).
 */

export interface AuthUser {
  /** WorkOS User ID (sub claim in JWT) */
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  /** Resolved from DB after first sign-in */
  artistId?: string;
}

export interface SessionResponseDto {
  user: AuthUser | null;
  isAuthenticated: boolean;
}
