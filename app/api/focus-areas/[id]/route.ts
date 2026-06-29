import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { focusAreas } from '@/db/schema';
import { eq } from 'drizzle-orm';

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
    return NextResponse.json({ error: 'Invalid focus area id' }, { status: 400 });
  }
  try {
    const body = await req.json();
    const updates: Partial<typeof focusAreas.$inferInsert> = {};
    if (typeof body.title === 'string') updates.title = body.title.trim();
    if (typeof body.position === 'number') updates.position = body.position;

    const [updated] = await db
      .update(focusAreas)
      .set(updates)
      .where(eq(focusAreas.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: 'Focus area not found' }, { status: 404 });
    }
    return NextResponse.json(updated);
  } catch (err) {
    console.error('PATCH /api/focus-areas/[id] failed', err);
    return NextResponse.json({ error: 'Failed to update focus area' }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = parseId(params.id);
  if (id === null) {
    return NextResponse.json({ error: 'Invalid focus area id' }, { status: 400 });
  }
  try {
    const [deleted] = await db
      .delete(focusAreas)
      .where(eq(focusAreas.id, id))
      .returning();
    if (!deleted) {
      return NextResponse.json({ error: 'Focus area not found' }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('DELETE /api/focus-areas/[id] failed', err);
    return NextResponse.json({ error: 'Failed to delete focus area' }, { status: 500 });
  }
}
