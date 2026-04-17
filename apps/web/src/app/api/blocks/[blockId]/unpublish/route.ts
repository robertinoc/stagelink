import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { resolveApiBaseUrl } from '@/lib/server/api-base-url';

interface RouteContext {
  params: Promise<{ blockId: string }>;
}

async function proxyPublishState(context: RouteContext, action: 'publish' | 'unpublish') {
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

  const { blockId } = await context.params;

  try {
    const response = await fetch(`${apiBaseUrl}/api/blocks/${blockId}/${action}`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${session.accessToken}`,
      },
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
    console.error(`[blocks][proxy] ${action} request failed`, error);
    return NextResponse.json(
      { message: `Could not ${action} the block right now.` },
      { status: 502 },
    );
  }
}

export function POST(_request: NextRequest, context: RouteContext) {
  return proxyPublishState(context, 'unpublish');
}
