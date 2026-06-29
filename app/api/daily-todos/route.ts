import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { dailyTodos } from '@/db/schema';
import { eq, asc } from 'drizzle-orm';
import { todayKey } from '@/lib/dates';

export async function GET(req: NextRequest) {
  const date = req.nextUrl.searchParams.get('date') ?? todayKey();
  try {
    const rows = await db
      .select()
      .from(dailyTodos)
      .where(eq(dailyTodos.date, date))
      .orderBy(asc(dailyTodos.position), asc(dailyTodos.createdAt));
    return NextResponse.json(rows);
  } catch (err) {
    console.error('GET /api/daily-todos failed', err);
    return NextResponse.json({ error: 'Failed to load to-dos' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const title = typeof body.title === 'string' ? body.title.trim() : '';
    const date = typeof body.date === 'string' && body.date ? body.date : todayKey();
    if (!title) {
      return NextResponse.json({ error: 'title is required' }, { status: 400 });
    }

    const [created] = await db
      .insert(dailyTodos)
      .values({
        title,
        date,
        position: typeof body.position === 'number' ? body.position : 0,
      })
      .returning();

    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    console.error('POST /api/daily-todos failed', err);
    return NextResponse.json({ error: 'Failed to add to-do' }, { status: 500 });
  }
}
