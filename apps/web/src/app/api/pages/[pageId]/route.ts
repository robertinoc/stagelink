import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { resolveApiBaseUrl } from '@/lib/server/api-base-url';

interface RouteContext {
  params: Promise<{ pageId: string }>;
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const apiBaseUrl = resolveApiBaseUrl();
  if (!apiBaseUrl) {
    return NextResponse.json(
      { message: 'Pages API is not configured on this deployment.' },
      { status: 500 },
    );
  }

  const { pageId } = await context.params;
  const body = await request.text();

  try {
    const response = await fetch(`${apiBaseUrl}/api/pages/${pageId}`, {
      method: 'PATCH',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
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
    console.error('[pages][proxy] PATCH page request failed', error);
    return NextResponse.json(
      { message: 'Could not reach the pages API right now.' },
      { status: 502 },
    );
  }
}
