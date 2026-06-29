import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { tasks } from '@/db/schema';
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
    return NextResponse.json({ error: 'Invalid task id' }, { status: 400 });
  }

  try {
    const body = await req.json();
    const updates: Partial<typeof tasks.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (typeof body.title === 'string') updates.title = body.title.trim();
    if (typeof body.description === 'string' || body.description === null)
      updates.description = body.description;
    if (typeof body.done === 'boolean') updates.done = body.done;
    if (['low', 'medium', 'high'].includes(body.priority))
      updates.priority = body.priority;
    if (typeof body.dueDate === 'string' || body.dueDate === null)
      updates.dueDate = body.dueDate;

    const [updated] = await db
      .update(tasks)
      .set(updates)
      .where(eq(tasks.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }
    return NextResponse.json(updated);
  } catch (err) {
    console.error('PATCH /api/tasks/[id] failed', err);
    return NextResponse.json(
      { error: 'Failed to update task' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = parseId(params.id);
  if (id === null) {
    return NextResponse.json({ error: 'Invalid task id' }, { status: 400 });
  }

  try {
    const [deleted] = await db
      .delete(tasks)
      .where(eq(tasks.id, id))
      .returning();

    if (!deleted) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('DELETE /api/tasks/[id] failed', err);
    return NextResponse.json(
      { error: 'Failed to delete task' },
      { status: 500 }
    );
  }
}
