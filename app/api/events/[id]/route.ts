import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { events } from '@/db/schema';
import { eq } from 'drizzle-orm';

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

function parseId(idParam: string): number | null {
  const id = Number(idParam);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = parseId(params.id);
  if (id === null) {
    return NextResponse.json({ error: 'Invalid event id' }, { status: 400 });
  }
  try {
    const body = await req.json();
    const updates: Partial<typeof events.$inferInsert> = {};
    if (typeof body.title === 'string') updates.title = body.title.trim();
    if (typeof body.date === 'string') updates.date = body.date;
    if (typeof body.endDate === 'string' || body.endDate === null)
      updates.endDate = body.endDate;
    if (typeof body.time === 'string' || body.time === null)
      updates.time = body.time;
    if (
      (typeof body.color === 'string' && HEX_COLOR.test(body.color)) ||
      body.color === null
    ) {
      updates.color = body.color;
    }
    if (typeof body.notes === 'string' || body.notes === null)
      updates.notes = body.notes;

    const [updated] = await db
      .update(events)
      .set(updates)
      .where(eq(events.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }
    return NextResponse.json(updated);
  } catch (err) {
    console.error('PATCH /api/events/[id] failed', err);
    return NextResponse.json({ error: 'Failed to update event' }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = parseId(params.id);
  if (id === null) {
    return NextResponse.json({ error: 'Invalid event id' }, { status: 400 });
  }
  try {
    const [deleted] = await db.delete(events).where(eq(events.id, id)).returning();
    if (!deleted) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('DELETE /api/events/[id] failed', err);
    return NextResponse.json({ error: 'Failed to delete event' }, { status: 500 });
  }
}
