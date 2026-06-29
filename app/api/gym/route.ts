import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { gymSessions, gymExercises } from '@/db/schema';
import { eq, asc, inArray } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  const weekStart = req.nextUrl.searchParams.get('weekStart');
  if (!weekStart) {
    return NextResponse.json({ error: 'weekStart is required' }, { status: 400 });
  }
  try {
    const sessions = await db
      .select()
      .from(gymSessions)
      .where(eq(gymSessions.weekStart, weekStart))
      .orderBy(asc(gymSessions.date));

    const sessionIds = sessions.map((s) => s.id);
    const exercises = sessionIds.length
      ? await db
          .select()
          .from(gymExercises)
          .where(inArray(gymExercises.sessionId, sessionIds))
          .orderBy(asc(gymExercises.position))
      : [];

    const exercisesBySession = new Map<number, typeof exercises>();
    for (const ex of exercises) {
      const list = exercisesBySession.get(ex.sessionId) ?? [];
      list.push(ex);
      exercisesBySession.set(ex.sessionId, list);
    }

    const result = sessions.map((s) => ({
      ...s,
      exercises: exercisesBySession.get(s.id) ?? [],
    }));

    return NextResponse.json(result);
  } catch (err) {
    console.error('GET /api/gym failed', err);
    return NextResponse.json({ error: 'Failed to load gym sessions' }, { status: 500 });
  }
}

/** Creates a session for a given date if one doesn't exist yet, or returns
 *  the existing one. One session per date is enforced at the app level
 *  (checked here) rather than a DB unique constraint, since "upsert and
 *  return with exercises" is simpler to express this way with Drizzle. */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const weekStart = typeof body.weekStart === 'string' ? body.weekStart : '';
    const date = typeof body.date === 'string' ? body.date : '';
    if (!weekStart || !date) {
      return NextResponse.json(
        { error: 'weekStart and date are required' },
        { status: 400 }
      );
    }

    const existing = await db
      .select()
      .from(gymSessions)
      .where(eq(gymSessions.date, date));

    if (existing.length > 0) {
      return NextResponse.json({ ...existing[0], exercises: [] });
    }

    const [created] = await db
      .insert(gymSessions)
      .values({
        weekStart,
        date,
        went: typeof body.went === 'boolean' ? body.went : false,
        workoutType: typeof body.workoutType === 'string' ? body.workoutType : null,
      })
      .returning();

    return NextResponse.json({ ...created, exercises: [] }, { status: 201 });
  } catch (err) {
    console.error('POST /api/gym failed', err);
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
  }
}
