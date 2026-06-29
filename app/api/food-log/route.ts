import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { foodLogEntries } from '@/db/schema';
import { eq, asc, and, gte, lte } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  const date = req.nextUrl.searchParams.get('date');
  const from = req.nextUrl.searchParams.get('from');
  const to = req.nextUrl.searchParams.get('to');

  try {
    let rows;
    if (date) {
      rows = await db
        .select()
        .from(foodLogEntries)
        .where(eq(foodLogEntries.date, date))
        .orderBy(asc(foodLogEntries.createdAt));
    } else if (from && to) {
      rows = await db
        .select()
        .from(foodLogEntries)
        .where(and(gte(foodLogEntries.date, from), lte(foodLogEntries.date, to)))
        .orderBy(asc(foodLogEntries.date), asc(foodLogEntries.createdAt));
    } else {
      return NextResponse.json(
        { error: 'Provide either date, or both from and to' },
        { status: 400 }
      );
    }
    return NextResponse.json(rows);
  } catch (err) {
    console.error('GET /api/food-log failed', err);
    return NextResponse.json({ error: 'Failed to load food log' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const description =
      typeof body.description === 'string' ? body.description.trim() : '';
    const date = typeof body.date === 'string' ? body.date : '';
    if (!description || !date) {
      return NextResponse.json(
        { error: 'description and date are required' },
        { status: 400 }
      );
    }

    const [created] = await db
      .insert(foodLogEntries)
      .values({
        date,
        description,
        calories:
          typeof body.calories === 'number' && body.calories >= 0
            ? Math.round(body.calories)
            : null,
        recipeId:
          typeof body.recipeId === 'number' ? body.recipeId : null,
      })
      .returning();

    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    console.error('POST /api/food-log failed', err);
    return NextResponse.json({ error: 'Failed to add entry' }, { status: 500 });
  }
}
