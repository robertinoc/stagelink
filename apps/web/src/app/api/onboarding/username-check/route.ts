import { NextRequest, NextResponse } from 'next/server';

function resolveApiBaseUrl(): string | null {
  const configuredUrl = process.env['API_URL'] ?? process.env['NEXT_PUBLIC_API_URL'];
  if (!configuredUrl) return null;

  const trimmedUrl = configuredUrl.replace(/\/+$/, '');
  return trimmedUrl.endsWith('/api') ? trimmedUrl.slice(0, -4) : trimmedUrl;
}

export async function GET(request: NextRequest) {
  const value = request.nextUrl.searchParams.get('value');
  if (!value) {
    return NextResponse.json({ message: 'Missing value' }, { status: 400 });
  }

  const apiBaseUrl = resolveApiBaseUrl();
  if (!apiBaseUrl) {
    return NextResponse.json(
      { message: 'Username check is not configured on this deployment.' },
      { status: 500 },
    );
  }

  const params = new URLSearchParams({ value });
  const endpoint = `${apiBaseUrl}/api/onboarding/username-check?${params.toString()}`;

  try {
    const response = await fetch(endpoint, {
      cache: 'no-store',
      headers: { Accept: 'application/json' },
    });

    const body = await response.text();

    return new NextResponse(body, {
      status: response.status,
      headers: {
        'Content-Type': response.headers.get('Content-Type') ?? 'application/json',
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('[onboarding][username-check] Proxy request failed', error);

    return NextResponse.json(
      { message: 'Username check is temporarily unavailable.' },
      { status: 502 },
    );
  }
}
