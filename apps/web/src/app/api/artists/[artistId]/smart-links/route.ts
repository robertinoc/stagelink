import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { resolveApiBaseUrl } from '@/lib/server/api-base-url';

interface RouteContext {
  params: Promise<{ artistId: string }>;
}

async function proxyArtistSmartLinksRequest(
  request: NextRequest,
  context: RouteContext,
  method: 'GET' | 'POST',
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const apiBaseUrl = resolveApiBaseUrl();
  if (!apiBaseUrl) {
    return NextResponse.json(
      { message: 'Smart Links API is not configured on this deployment.' },
      { status: 500 },
    );
  }

  const { artistId } = await context.params;
  const body = method === 'POST' ? await request.text() : undefined;

  try {
    const response = await fetch(
      `${apiBaseUrl}/api/artists/${encodeURIComponent(artistId)}/smart-links`,
      {
        method,
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${session.accessToken}`,
          ...(method === 'POST' ? { 'Content-Type': 'application/json' } : {}),
        },
        ...(body ? { body } : {}),
        cache: 'no-store',
      },
    );

    const responseBody = await response.text();
    return new NextResponse(responseBody, {
      status: response.status,
      headers: {
        'Content-Type': response.headers.get('Content-Type') ?? 'application/json',
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error(`[smart-links][proxy] ${method} artist smart links request failed`, error);
    return NextResponse.json(
      { message: 'Could not reach Smart Links right now.' },
      { status: 502 },
    );
  }
}

export function GET(request: NextRequest, context: RouteContext) {
  return proxyArtistSmartLinksRequest(request, context, 'GET');
}

export function POST(request: NextRequest, context: RouteContext) {
  return proxyArtistSmartLinksRequest(request, context, 'POST');
}
