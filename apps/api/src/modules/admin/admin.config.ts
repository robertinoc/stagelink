const DEFAULT_BEHIND_OWNER_EMAILS: readonly string[] = ['robertinoc@gmail.com'];

export function parseBehindOwnerEmails(
  raw = process.env['BEHIND_ADMIN_EMAILS'],
): readonly string[] {
  const emails = raw
    ?.split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

  return emails && emails.length > 0 ? emails : DEFAULT_BEHIND_OWNER_EMAILS;
}

export const BEHIND_OWNER_EMAILS: readonly string[] = parseBehindOwnerEmails();

export function isBehindOwnerEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return BEHIND_OWNER_EMAILS.includes(email.toLowerCase());
}
