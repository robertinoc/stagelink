import { NextResponse } from 'next/server';
import { apiFetch, getSession } from '@/lib/auth';

export const runtime = 'nodejs';

export async function DELETE(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
  }

  const payload = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const response = await apiFetch('/api/privacy/account', {
    accessToken: session.accessToken,
    method: 'DELETE',
    body: JSON.stringify(payload),
    cache: 'no-store',
  });

  const body = await response.text();
  return new NextResponse(body, {
    status: response.status,
    headers: {
      'Content-Type': response.headers.get('content-type') ?? 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}
