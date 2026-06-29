import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { focusAreas, focusGoals } from '@/db/schema';
import { eq, asc, inArray } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  const weekStart = req.nextUrl.searchParams.get('weekStart');
  if (!weekStart) {
    return NextResponse.json({ error: 'weekStart is required' }, { status: 400 });
  }
  try {
    const areas = await db
      .select()
      .from(focusAreas)
      .where(eq(focusAreas.weekStart, weekStart))
      .orderBy(asc(focusAreas.position), asc(focusAreas.createdAt));

    const areaIds = areas.map((a) => a.id);
    const goals = areaIds.length
      ? await db
          .select()
          .from(focusGoals)
          .where(inArray(focusGoals.focusAreaId, areaIds))
          .orderBy(asc(focusGoals.position))
      : [];

    const goalsByArea = new Map<number, typeof goals>();
    for (const g of goals) {
      const list = goalsByArea.get(g.focusAreaId) ?? [];
      list.push(g);
      goalsByArea.set(g.focusAreaId, list);
    }

    const result = areas.map((a) => ({
      ...a,
      goals: goalsByArea.get(a.id) ?? [],
    }));

    return NextResponse.json(result);
  } catch (err) {
    console.error('GET /api/focus-areas failed', err);
    return NextResponse.json({ error: 'Failed to load focus areas' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const title = typeof body.title === 'string' ? body.title.trim() : '';
    const weekStart = typeof body.weekStart === 'string' ? body.weekStart : '';
    if (!title || !weekStart) {
      return NextResponse.json(
        { error: 'title and weekStart are required' },
        { status: 400 }
      );
    }

    const [created] = await db
      .insert(focusAreas)
      .values({
        title,
        weekStart,
        position: typeof body.position === 'number' ? body.position : 0,
      })
      .returning();

    return NextResponse.json({ ...created, goals: [] }, { status: 201 });
  } catch (err) {
    console.error('POST /api/focus-areas failed', err);
    return NextResponse.json({ error: 'Failed to create focus area' }, { status: 500 });
  }
}
