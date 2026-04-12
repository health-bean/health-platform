import { NextResponse } from 'next/server';
import { getSessionFromCookies } from '@/lib/auth/session';
import { db } from '@/lib/db';
import { insightAlerts } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export async function GET() {
  const session = await getSessionFromCookies();
  if (!session?.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const alerts = await db.select().from(insightAlerts)
    .where(and(eq(insightAlerts.userId, session.userId), eq(insightAlerts.dismissed, false)))
    .orderBy(insightAlerts.createdAt);

  return NextResponse.json(alerts);
}
