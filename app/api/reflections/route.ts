import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { reflections } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  const weekStart = req.nextUrl.searchParams.get('weekStart');
  if (!weekStart) {
    return NextResponse.json({ error: 'weekStart is required' }, { status: 400 });
  }
  try {
    const rows = await db
      .select()
      .from(reflections)
      .where(eq(reflections.weekStart, weekStart));

    // No row yet just means "no reflection written" — return an empty
    // placeholder rather than a 404, since the client always expects an object.
    if (rows.length === 0) {
      return NextResponse.json({ id: null, weekStart, content: '' });
    }
    return NextResponse.json(rows[0]);
  } catch (err) {
    console.error('GET /api/reflections failed', err);
    return NextResponse.json({ error: 'Failed to load reflection' }, { status: 500 });
  }
}

/** Upserts the reflection for a week: creates it on first save, updates
 *  thereafter. weekStart has a unique constraint, so this is safe under
 *  concurrent calls. */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const weekStart = typeof body.weekStart === 'string' ? body.weekStart : '';
    const content = typeof body.content === 'string' ? body.content : '';
    if (!weekStart) {
      return NextResponse.json({ error: 'weekStart is required' }, { status: 400 });
    }

    const existing = await db
      .select()
      .from(reflections)
      .where(eq(reflections.weekStart, weekStart));

    if (existing.length > 0) {
      const [updated] = await db
        .update(reflections)
        .set({ content, updatedAt: new Date() })
        .where(eq(reflections.weekStart, weekStart))
        .returning();
      return NextResponse.json(updated);
    }

    const [created] = await db
      .insert(reflections)
      .values({ weekStart, content })
      .returning();
    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    console.error('POST /api/reflections failed', err);
    return NextResponse.json({ error: 'Failed to save reflection' }, { status: 500 });
  }
}
