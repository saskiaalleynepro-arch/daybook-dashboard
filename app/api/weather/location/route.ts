import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { settings } from '@/db/schema';
import { eq } from 'drizzle-orm';

const KEY = 'weather_location';

export async function GET() {
  try {
    const rows = await db
      .select()
      .from(settings)
      .where(eq(settings.key, KEY));

    if (rows.length === 0) {
      return NextResponse.json({ location: null });
    }
    return NextResponse.json({ location: JSON.parse(rows[0].value) });
  } catch (err) {
    console.error('GET /api/weather/location failed', err);
    return NextResponse.json(
      { error: 'Failed to load saved location' },
      { status: 500 }
    );
  }
}

/** Upserts the saved location. Body: { name, latitude, longitude }. */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const latitude = Number(body.latitude);
    const longitude = Number(body.longitude);

    if (!name || !Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return NextResponse.json(
        { error: 'name, latitude, and longitude are required' },
        { status: 400 }
      );
    }

    const value = JSON.stringify({ name, latitude, longitude });

    const existing = await db
      .select()
      .from(settings)
      .where(eq(settings.key, KEY));

    if (existing.length > 0) {
      await db.update(settings).set({ value }).where(eq(settings.key, KEY));
    } else {
      await db.insert(settings).values({ key: KEY, value });
    }

    return NextResponse.json({ location: { name, latitude, longitude } });
  } catch (err) {
    console.error('POST /api/weather/location failed', err);
    return NextResponse.json(
      { error: 'Failed to save location' },
      { status: 500 }
    );
  }
}
