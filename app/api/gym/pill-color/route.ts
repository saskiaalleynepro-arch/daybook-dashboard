import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { settings } from '@/db/schema';
import { eq } from 'drizzle-orm';

const KEY = 'gym_pill_color';
const DEFAULT_COLOR = '#8a7a6b';
const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

export async function GET() {
  try {
    const rows = await db.select().from(settings).where(eq(settings.key, KEY));
    return NextResponse.json({
      color: rows.length > 0 ? rows[0].value : DEFAULT_COLOR,
    });
  } catch (err) {
    console.error('GET /api/gym/pill-color failed', err);
    return NextResponse.json(
      { error: 'Failed to load gym pill color' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const color = typeof body.color === 'string' ? body.color : '';
    if (!HEX_COLOR.test(color)) {
      return NextResponse.json({ error: 'Invalid color' }, { status: 400 });
    }

    const existing = await db.select().from(settings).where(eq(settings.key, KEY));
    if (existing.length > 0) {
      await db.update(settings).set({ value: color }).where(eq(settings.key, KEY));
    } else {
      await db.insert(settings).values({ key: KEY, value: color });
    }

    return NextResponse.json({ color });
  } catch (err) {
    console.error('POST /api/gym/pill-color failed', err);
    return NextResponse.json(
      { error: 'Failed to save gym pill color' },
      { status: 500 }
    );
  }
}
