import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { habitLogs } from '@/db/schema';
import { and, eq } from 'drizzle-orm';
import { todayKey } from '@/lib/dates';

function parseId(idParam: string): number | null {
  const id = Number(idParam);
  return Number.isInteger(id) && id > 0 ? id : null;
}

/** Toggles today's completion for a habit. Body can optionally specify
 *  { date: "YYYY-MM-DD" } to toggle a different day (e.g. backfilling
 *  yesterday from the week strip); defaults to today. */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const habitId = parseId(params.id);
  if (habitId === null) {
    return NextResponse.json({ error: 'Invalid habit id' }, { status: 400 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const date =
      typeof body.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(body.date)
        ? body.date
        : todayKey();

    const existing = await db
      .select()
      .from(habitLogs)
      .where(and(eq(habitLogs.habitId, habitId), eq(habitLogs.date, date)));

    if (existing.length > 0) {
      await db
        .delete(habitLogs)
        .where(and(eq(habitLogs.habitId, habitId), eq(habitLogs.date, date)));
      return NextResponse.json({ date, done: false });
    } else {
      await db.insert(habitLogs).values({ habitId, date });
      return NextResponse.json({ date, done: true });
    }
  } catch (err) {
    console.error('POST /api/habits/[id]/toggle failed', err);
    return NextResponse.json(
      { error: 'Failed to toggle habit' },
      { status: 500 }
    );
  }
}
