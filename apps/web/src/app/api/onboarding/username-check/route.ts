import { NextRequest, NextResponse } from 'next/server';
import { apiFetch, getSession } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const value = request.nextUrl.searchParams.get('value');
  if (!value) {
    return NextResponse.json({ message: 'Missing value' }, { status: 400 });
  }

  const params = new URLSearchParams({ value });
  const response = await apiFetch(`/api/onboarding/username-check?${params.toString()}`, {
    accessToken: session.accessToken,
    cache: 'no-store',
  });

  const body = await response.text();

  return new NextResponse(body, {
    status: response.status,
    headers: {
      'Content-Type': response.headers.get('Content-Type') ?? 'application/json',
      'Cache-Control': 'no-store',
    },
  });
}
