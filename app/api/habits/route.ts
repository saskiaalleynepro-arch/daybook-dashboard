import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { habits, habitLogs } from '@/db/schema';
import { eq, asc, gte } from 'drizzle-orm';
import { daysInWeek, currentWeekStart } from '@/lib/dates';

/** Returns all active habits plus, for the requested week, which days each
 *  one was completed and a rolled-up score. weekStart defaults to the
 *  current week if not provided. */
export async function GET(req: NextRequest) {
  const weekStart =
    req.nextUrl.searchParams.get('weekStart') ?? currentWeekStart();

  try {
    const allHabits = await db
      .select()
      .from(habits)
      .where(eq(habits.archived, false))
      .orderBy(asc(habits.position), asc(habits.createdAt));

    const days = daysInWeek(weekStart);
    const weekEnd = days[6];

    const logs = await db
      .select()
      .from(habitLogs)
      .where(gte(habitLogs.date, weekStart));
    const logsInRange = logs.filter((l) => l.date <= weekEnd);

    const logsByHabit = new Map<number, Set<string>>();
    for (const log of logsInRange) {
      const set = logsByHabit.get(log.habitId) ?? new Set<string>();
      set.add(log.date);
      logsByHabit.set(log.habitId, set);
    }

    let totalGoal = 0;
    let totalDone = 0;

    const result = allHabits.map((h) => {
      const doneDates = logsByHabit.get(h.id) ?? new Set<string>();
      const completedThisWeek = days.filter((d) => doneDates.has(d)).length;
      totalGoal += h.targetPerWeek;
      totalDone += Math.min(completedThisWeek, h.targetPerWeek);

      return {
        ...h,
        days: days.map((d) => ({ date: d, done: doneDates.has(d) })),
        completedThisWeek,
      };
    });

    const overallScore =
      totalGoal > 0 ? Math.round((totalDone / totalGoal) * 100) : 0;

    return NextResponse.json({ habits: result, weekStart, overallScore });
  } catch (err) {
    console.error('GET /api/habits failed', err);
    return NextResponse.json({ error: 'Failed to load habits' }, { status: 500 });
  }
}

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const targetPerWeek =
      Number.isInteger(body.targetPerWeek) &&
      body.targetPerWeek > 0 &&
      body.targetPerWeek <= 7
        ? body.targetPerWeek
        : 7;

    const color =
      typeof body.color === 'string' && HEX_COLOR.test(body.color)
        ? body.color
        : '#8a7a6b';

    const section = body.section === 'devotional' ? 'devotional' : 'daily';

    const [created] = await db
      .insert(habits)
      .values({
        name,
        emoji: typeof body.emoji === 'string' && body.emoji ? body.emoji : '✅',
        color,
        section,
        targetPerWeek,
        position: typeof body.position === 'number' ? body.position : 0,
      })
      .returning();

    return NextResponse.json(
      { ...created, days: [], completedThisWeek: 0 },
      { status: 201 }
    );
  } catch (err) {
    console.error('POST /api/habits failed', err);
    return NextResponse.json({ error: 'Failed to create habit' }, { status: 500 });
  }
}
