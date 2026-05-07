import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { resolveApiBaseUrl } from '@/lib/server/api-base-url';

interface RouteContext {
  params: Promise<{ smartLinkId: string }>;
}

async function proxySmartLinkRequest(
  request: NextRequest,
  context: RouteContext,
  method: 'PATCH' | 'DELETE',
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

  const { smartLinkId } = await context.params;
  const body = method === 'PATCH' ? await request.text() : undefined;

  try {
    const response = await fetch(
      `${apiBaseUrl}/api/smart-links/${encodeURIComponent(smartLinkId)}`,
      {
        method,
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${session.accessToken}`,
          ...(method === 'PATCH' ? { 'Content-Type': 'application/json' } : {}),
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
    console.error(`[smart-links][proxy] ${method} request failed`, error);
    return NextResponse.json(
      { message: 'Could not save Smart Link changes right now.' },
      { status: 502 },
    );
  }
}

export function PATCH(request: NextRequest, context: RouteContext) {
  return proxySmartLinkRequest(request, context, 'PATCH');
}

export function DELETE(request: NextRequest, context: RouteContext) {
  return proxySmartLinkRequest(request, context, 'DELETE');
}
