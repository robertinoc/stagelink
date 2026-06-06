import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { createBillingPortalSession } from '@/lib/api/billing';

export const runtime = 'nodejs';

interface RouteContext {
  params: Promise<{ artistId: string }>;
}

/**
 * Returns the Stripe Customer Portal URL as JSON (instead of redirecting like
 * the `startPortalAction` server action) so the client can open it in a NEW
 * TAB via window.open — the dashboard stays put. Used by OpenPortalButton.
 */
export async function POST(request: NextRequest, context: RouteContext) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { artistId } = await context.params;
  const body = (await request.json().catch(() => ({}))) as {
    returnUrl?: string;
    targetPlan?: 'pro' | 'pro_plus';
  };
  const returnUrl = body.returnUrl ?? request.nextUrl.origin;

  try {
    const { url } = await createBillingPortalSession(
      artistId,
      { returnUrl, targetPlan: body.targetPlan },
      session.accessToken,
    );
    return NextResponse.json({ url });
  } catch {
    return NextResponse.json({ message: 'Could not open the billing portal.' }, { status: 502 });
  }
}
