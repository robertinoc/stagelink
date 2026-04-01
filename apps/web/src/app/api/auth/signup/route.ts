import { getSignUpUrl } from '@workos-inc/authkit-nextjs';
import { redirect } from 'next/navigation';

/**
 * GET /api/auth/signup
 *
 * Generates the WorkOS sign-up URL and redirects the user to it.
 * Must live in a Route Handler because getSignUpUrl() writes auth state cookies.
 */
export async function GET() {
  const signUpUrl = await getSignUpUrl();
  redirect(signUpUrl);
}
