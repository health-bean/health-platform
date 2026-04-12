import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromCookies } from '@/lib/auth/session';
import { getOrComputeDayComposite } from '@/lib/insights/day-composite-db';

export async function GET(req: NextRequest) {
  const session = await getSessionFromCookies();
  if (!session?.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const date = req.nextUrl.searchParams.get('date') ?? new Date().toISOString().split('T')[0];

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: 'Invalid date format' }, { status: 400 });
  }

  const composite = await getOrComputeDayComposite(session.userId, date);
  return NextResponse.json(composite);
}
