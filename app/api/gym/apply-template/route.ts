import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { gymSessions, gymExercises, settings } from '@/db/schema';
import { eq, inArray } from 'drizzle-orm';
import { daysInWeek } from '@/lib/dates';

const TEMPLATE_KEY = 'gym_template_week';

/** Copies the standing gym template week's plan (workout type + exercises
 *  per day, mapped by day-of-week) into the given target week. "went" is
 *  always reset to false, since showing up for the new week hasn't
 *  happened yet. No-ops if no template has been set.
 *
 *  By default, never overwrites a week that already has sessions. Pass
 *  `force: true` to delete the target week's existing sessions first and
 *  replace them with the template — used for deliberately re-applying the
 *  template onto a week created before the template existed. */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const weekStart = typeof body.weekStart === 'string' ? body.weekStart : '';
    const force = body.force === true;
    if (!weekStart) {
      return NextResponse.json({ error: 'weekStart is required' }, { status: 400 });
    }

    const templateSetting = await db
      .select()
      .from(settings)
      .where(eq(settings.key, TEMPLATE_KEY));

    if (templateSetting.length === 0) {
      return NextResponse.json({ copied: 0, reason: 'no_template_set' });
    }
    const templateWeek = templateSetting[0].value;

    if (templateWeek === weekStart) {
      // Don't copy the template onto itself.
      return NextResponse.json({ copied: 0, reason: 'is_template_week' });
    }

    const existingTargetSessions = await db
      .select()
      .from(gymSessions)
      .where(eq(gymSessions.weekStart, weekStart));

    if (existingTargetSessions.length > 0) {
      if (!force) {
        return NextResponse.json({ copied: 0, reason: 'week_not_empty' });
      }
      // Force mode: clear out the target week's existing sessions first.
      // gym_exercises for those sessions cascade-delete via the FK.
      await db.delete(gymSessions).where(eq(gymSessions.weekStart, weekStart));
    }

    const templateSessions = await db
      .select()
      .from(gymSessions)
      .where(eq(gymSessions.weekStart, templateWeek));

    if (templateSessions.length === 0) {
      return NextResponse.json({ copied: 0, reason: 'template_week_empty' });
    }

    const templateSessionIds = templateSessions.map((s) => s.id);
    const templateExercises = templateSessionIds.length
      ? await db
          .select()
          .from(gymExercises)
          .where(inArray(gymExercises.sessionId, templateSessionIds))
      : [];

    const exercisesBySession = new Map<number, typeof templateExercises>();
    for (const ex of templateExercises) {
      const list = exercisesBySession.get(ex.sessionId) ?? [];
      list.push(ex);
      exercisesBySession.set(ex.sessionId, list);
    }

    const templateDays = daysInWeek(templateWeek);
    const targetDays = daysInWeek(weekStart);

    let copiedCount = 0;

    for (const session of templateSessions) {
      const hasContent =
        session.workoutType || (exercisesBySession.get(session.id)?.length ?? 0) > 0;
      if (!hasContent) continue;

      const dayIndex = templateDays.indexOf(session.date);
      if (dayIndex === -1) continue;
      const targetDate = targetDays[dayIndex];

      const [newSession] = await db
        .insert(gymSessions)
        .values({
          weekStart,
          date: targetDate,
          went: false,
          workoutType: session.workoutType,
        })
        .returning();

      const exercisesToCopy = exercisesBySession.get(session.id) ?? [];
      if (exercisesToCopy.length > 0) {
        await db.insert(gymExercises).values(
          exercisesToCopy.map((ex) => ({
            sessionId: newSession.id,
            name: ex.name,
            sets: ex.sets,
            reps: ex.reps,
            weight: ex.weight,
            position: ex.position,
          }))
        );
      }
      copiedCount += 1;
    }

    return NextResponse.json({ copied: copiedCount, templateWeek });
  } catch (err) {
    console.error('POST /api/gym/apply-template failed', err);
    return NextResponse.json(
      { error: 'Failed to apply gym template' },
      { status: 500 }
    );
  }
}
