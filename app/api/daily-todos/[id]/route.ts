import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { dailyTodos } from '@/db/schema';
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
    return NextResponse.json({ error: 'Invalid to-do id' }, { status: 400 });
  }
  try {
    const body = await req.json();
    const updates: Partial<typeof dailyTodos.$inferInsert> = {};
    if (typeof body.title === 'string') updates.title = body.title.trim();
    if (typeof body.done === 'boolean') updates.done = body.done;
    if (typeof body.position === 'number') updates.position = body.position;

    const [updated] = await db
      .update(dailyTodos)
      .set(updates)
      .where(eq(dailyTodos.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: 'To-do not found' }, { status: 404 });
    }
    return NextResponse.json(updated);
  } catch (err) {
    console.error('PATCH /api/daily-todos/[id] failed', err);
    return NextResponse.json({ error: 'Failed to update to-do' }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = parseId(params.id);
  if (id === null) {
    return NextResponse.json({ error: 'Invalid to-do id' }, { status: 400 });
  }
  try {
    const [deleted] = await db
      .delete(dailyTodos)
      .where(eq(dailyTodos.id, id))
      .returning();
    if (!deleted) {
      return NextResponse.json({ error: 'To-do not found' }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('DELETE /api/daily-todos/[id] failed', err);
    return NextResponse.json({ error: 'Failed to delete to-do' }, { status: 500 });
  }
}
