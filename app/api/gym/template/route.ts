import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { settings } from '@/db/schema';
import { eq } from 'drizzle-orm';

const KEY = 'gym_template_week';

export async function GET() {
  try {
    const rows = await db.select().from(settings).where(eq(settings.key, KEY));
    return NextResponse.json({
      templateWeek: rows.length > 0 ? rows[0].value : null,
    });
  } catch (err) {
    console.error('GET /api/gym/template failed', err);
    return NextResponse.json(
      { error: 'Failed to load gym template' },
      { status: 500 }
    );
  }
}

/** Sets which week (by its weekStart key) should act as the standing gym
 *  routine template. Any future empty week will copy its plan from this
 *  week going forward, until this is changed again. */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const weekStart = typeof body.weekStart === 'string' ? body.weekStart : '';
    if (!weekStart) {
      return NextResponse.json({ error: 'weekStart is required' }, { status: 400 });
    }

    const existing = await db.select().from(settings).where(eq(settings.key, KEY));
    if (existing.length > 0) {
      await db.update(settings).set({ value: weekStart }).where(eq(settings.key, KEY));
    } else {
      await db.insert(settings).values({ key: KEY, value: weekStart });
    }

    return NextResponse.json({ templateWeek: weekStart });
  } catch (err) {
    console.error('POST /api/gym/template failed', err);
    return NextResponse.json(
      { error: 'Failed to set gym template' },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    await db.delete(settings).where(eq(settings.key, KEY));
    return NextResponse.json({ templateWeek: null });
  } catch (err) {
    console.error('DELETE /api/gym/template failed', err);
    return NextResponse.json(
      { error: 'Failed to clear gym template' },
      { status: 500 }
    );
  }
}
