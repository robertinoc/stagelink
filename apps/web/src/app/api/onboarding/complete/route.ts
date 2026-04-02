import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

function resolveApiBaseUrl(): string | null {
  const configuredUrl = process.env['API_URL'] ?? process.env['NEXT_PUBLIC_API_URL'];
  if (!configuredUrl) return null;

  const trimmedUrl = configuredUrl.replace(/\/+$/, '');
  return trimmedUrl.endsWith('/api') ? trimmedUrl.slice(0, -4) : trimmedUrl;
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const apiBaseUrl = resolveApiBaseUrl();
  if (!apiBaseUrl) {
    return NextResponse.json(
      { message: 'Onboarding is not configured on this deployment.' },
      { status: 500 },
    );
  }

  const body = await request.text();

  try {
    const response = await fetch(`${apiBaseUrl}/api/onboarding/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${session.accessToken}`,
      },
      body,
      cache: 'no-store',
    });

    const responseBody = await response.text();

    return new NextResponse(responseBody, {
      status: response.status,
      headers: {
        'Content-Type': response.headers.get('Content-Type') ?? 'application/json',
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('[onboarding][complete] Proxy request failed', error);

    return NextResponse.json(
      { message: 'Could not complete onboarding right now.' },
      { status: 502 },
    );
  }
}
