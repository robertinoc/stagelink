/**
 * DTOs del módulo de autenticación.
 *
 * AuthenticatedUser: representa al usuario interno de StageLink
 * tal como se expone en GET /api/auth/me.
 * Nunca incluye datos sensibles (workosId queda fuera).
 */

export interface AuthenticatedUser {
  /** ID interno de StageLink */
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
  /** IDs de los artistas administrados por este usuario */
  artistIds: string[];
  isSuspended: boolean;
  createdAt: Date;
}
