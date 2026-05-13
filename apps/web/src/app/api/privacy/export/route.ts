import { NextResponse } from 'next/server';
import { apiFetch, getSession } from '@/lib/auth';

export const runtime = 'nodejs';

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
  }

  const response = await apiFetch('/api/privacy/export', {
    accessToken: session.accessToken,
    cache: 'no-store',
  });
  const body = await response.text();

  return new NextResponse(body, {
    status: response.status,
    headers: {
      'Content-Type': response.headers.get('content-type') ?? 'application/json; charset=utf-8',
      'Content-Disposition': 'attachment; filename="stagelink-data-export.json"',
      'Cache-Control': 'no-store',
    },
  });
}
