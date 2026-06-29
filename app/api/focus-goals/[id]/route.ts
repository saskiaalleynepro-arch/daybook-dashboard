import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { focusGoals } from '@/db/schema';
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
    return NextResponse.json({ error: 'Invalid goal id' }, { status: 400 });
  }
  try {
    const body = await req.json();
    const updates: Partial<typeof focusGoals.$inferInsert> = {};
    if (typeof body.title === 'string') updates.title = body.title.trim();
    if (typeof body.done === 'boolean') updates.done = body.done;

    const [updated] = await db
      .update(focusGoals)
      .set(updates)
      .where(eq(focusGoals.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
    }
    return NextResponse.json(updated);
  } catch (err) {
    console.error('PATCH /api/focus-goals/[id] failed', err);
    return NextResponse.json({ error: 'Failed to update goal' }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = parseId(params.id);
  if (id === null) {
    return NextResponse.json({ error: 'Invalid goal id' }, { status: 400 });
  }
  try {
    const [deleted] = await db
      .delete(focusGoals)
      .where(eq(focusGoals.id, id))
      .returning();
    if (!deleted) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('DELETE /api/focus-goals/[id] failed', err);
    return NextResponse.json({ error: 'Failed to delete goal' }, { status: 500 });
  }
}
