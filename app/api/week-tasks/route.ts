import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { weekTasks } from '@/db/schema';
import { asc, eq } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  const weekStart = req.nextUrl.searchParams.get('weekStart');
  if (!weekStart) {
    return NextResponse.json({ error: 'weekStart is required' }, { status: 400 });
  }
  try {
    const rows = await db
      .select()
      .from(weekTasks)
      .where(eq(weekTasks.weekStart, weekStart))
      .orderBy(asc(weekTasks.position), asc(weekTasks.createdAt));
    return NextResponse.json(rows);
  } catch (err) {
    console.error('GET /api/week-tasks failed', err);
    return NextResponse.json({ error: 'Failed to load tasks' }, { status: 500 });
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
      .insert(weekTasks)
      .values({
        title,
        weekStart,
        position: typeof body.position === 'number' ? body.position : 0,
      })
      .returning();

    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    console.error('POST /api/week-tasks failed', err);
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
  }
}
