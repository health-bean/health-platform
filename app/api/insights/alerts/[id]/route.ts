import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromCookies } from '@/lib/auth/session';
import { db } from '@/lib/db';
import { insightAlerts } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSessionFromCookies();
  if (!session?.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  await db.update(insightAlerts)
    .set({ dismissed: true, dismissedAt: new Date() })
    .where(and(eq(insightAlerts.id, id), eq(insightAlerts.userId, session.userId)));

  return NextResponse.json({ success: true });
}
