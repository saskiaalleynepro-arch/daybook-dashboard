import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { gymSessions } from '@/db/schema';
import { and, gte, lte } from 'drizzle-orm';

/** Lightweight gym session lookup for the Calendar view — just date and
 *  workout type for every day with a workout type set in the given range,
 *  not full exercise detail (the Gym tracker's own endpoint covers that). */
export async function GET(req: NextRequest) {
  const from = req.nextUrl.searchParams.get('from');
  const to = req.nextUrl.searchParams.get('to');
  if (!from || !to) {
    return NextResponse.json({ error: 'from and to are required' }, { status: 400 });
  }

  try {
    const sessions = await db
      .select({
        date: gymSessions.date,
        workoutType: gymSessions.workoutType,
        went: gymSessions.went,
      })
      .from(gymSessions)
      .where(and(gte(gymSessions.date, from), lte(gymSessions.date, to)));

    // Only days with an actual workout type set are relevant to the
    // calendar — a session row with no type (e.g. created then left blank)
    // isn't worth showing as a pill.
    const result = sessions.filter((s) => s.workoutType);

    return NextResponse.json(result);
  } catch (err) {
    console.error('GET /api/gym/calendar-summary failed', err);
    return NextResponse.json(
      { error: 'Failed to load gym calendar summary' },
      { status: 500 }
    );
  }
}
