import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { events } from '@/db/schema';
import { and, asc, gte, lte, sql } from 'drizzle-orm';

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

export async function GET(req: NextRequest) {
  const from = req.nextUrl.searchParams.get('from');
  const to = req.nextUrl.searchParams.get('to');

  try {
    // An event/block is "in range" if it overlaps [from, to] at all:
    // its start is <= to, AND its effective end (endDate if set, else its
    // own date) is >= from. This catches multi-day blocks that started
    // before the visible range but extend into it.
    const rows =
      from && to
        ? await db
            .select()
            .from(events)
            .where(
              and(
                lte(events.date, to),
                gte(sql`coalesce(${events.endDate}, ${events.date})`, from)
              )
            )
            .orderBy(asc(events.date), asc(events.time))
        : await db.select().from(events).orderBy(asc(events.date));
    return NextResponse.json(rows);
  } catch (err) {
    console.error('GET /api/events failed', err);
    return NextResponse.json({ error: 'Failed to load events' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const title = typeof body.title === 'string' ? body.title.trim() : '';
    const date = typeof body.date === 'string' ? body.date : '';
    if (!title || !date) {
      return NextResponse.json(
        { error: 'title and date are required' },
        { status: 400 }
      );
    }

    const endDate =
      typeof body.endDate === 'string' && body.endDate ? body.endDate : null;
    if (endDate && endDate < date) {
      return NextResponse.json(
        { error: 'endDate cannot be before date' },
        { status: 400 }
      );
    }

    const color =
      typeof body.color === 'string' && HEX_COLOR.test(body.color)
        ? body.color
        : null;

    const [created] = await db
      .insert(events)
      .values({
        title,
        date,
        endDate,
        time: typeof body.time === 'string' && body.time ? body.time : null,
        color,
        notes: typeof body.notes === 'string' ? body.notes : null,
      })
      .returning();

    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    console.error('POST /api/events failed', err);
    return NextResponse.json({ error: 'Failed to create event' }, { status: 500 });
  }
}
