/**
 * Behind the Stage — server-only configuration.
 *
 * This file is never bundled for the client because it is only imported
 * from Server Components and Route Handlers (no "use client" boundary).
 *
 * To add a new owner, append their WorkOS email to the array below.
 */
export const BEHIND_OWNER_EMAILS: readonly string[] = ['robertinoc@gmail.com'];

/** Returns true if the given email is allowed to access Behind the Stage. */
export function isBehindOwner(email: string | null | undefined): boolean {
  if (!email) return false;
  return BEHIND_OWNER_EMAILS.includes(email.toLowerCase());
}
