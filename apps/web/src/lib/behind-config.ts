/**
 * Behind the Stage — server-only configuration.
 *
 * This file is never bundled for the client because it is only imported
 * from Server Components and Route Handlers (no "use client" boundary).
 *
 * Admin access is controlled via the BEHIND_ADMIN_EMAILS environment variable
 * (comma-separated list of WorkOS email addresses). If the variable is not set,
 * access falls back to the hardcoded owner email.
 *
 * To grant access to a new admin:
 *   1. Go to Vercel → Project Settings → Environment Variables
 *   2. Set BEHIND_ADMIN_EMAILS to a comma-separated list of emails
 *      e.g. "owner@example.com,newadmin@example.com"
 *   3. Redeploy for the change to take effect
 */
function parseBehindAdminEmails(): readonly string[] {
  const envList = process.env.BEHIND_ADMIN_EMAILS;
  if (envList) {
    return envList
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);
  }
  return ['robertinoc@gmail.com'];
}

export const BEHIND_OWNER_EMAILS: readonly string[] = parseBehindAdminEmails();

/** Returns true if the given email is allowed to access Behind the Stage. */
export function isBehindOwner(email: string | null | undefined): boolean {
  if (!email) return false;
  return BEHIND_OWNER_EMAILS.includes(email.toLowerCase());
}
