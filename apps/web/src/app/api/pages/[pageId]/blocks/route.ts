import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { resolveApiBaseUrl } from '@/lib/server/api-base-url';

interface RouteContext {
  params: Promise<{ pageId: string }>;
}

async function proxyPageBlocksRequest(
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
      { message: 'Blocks API is not configured on this deployment.' },
      { status: 500 },
    );
  }

  const { pageId } = await context.params;
  const body = method === 'POST' ? await request.text() : undefined;

  try {
    const response = await fetch(`${apiBaseUrl}/api/pages/${pageId}/blocks`, {
      method,
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${session.accessToken}`,
        ...(method === 'POST' ? { 'Content-Type': 'application/json' } : {}),
      },
      ...(body ? { body } : {}),
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
    console.error(`[blocks][proxy] ${method} page blocks request failed`, error);
    return NextResponse.json(
      { message: 'Could not reach the page builder right now.' },
      { status: 502 },
    );
  }
}

export function GET(request: NextRequest, context: RouteContext) {
  return proxyPageBlocksRequest(request, context, 'GET');
}

export function POST(request: NextRequest, context: RouteContext) {
  return proxyPageBlocksRequest(request, context, 'POST');
}
