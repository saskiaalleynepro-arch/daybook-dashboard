import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { gymSessions } from '@/db/schema';
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
    return NextResponse.json({ error: 'Invalid session id' }, { status: 400 });
  }
  try {
    const body = await req.json();
    const updates: Partial<typeof gymSessions.$inferInsert> = {};
    if (typeof body.went === 'boolean') updates.went = body.went;
    if (typeof body.workoutType === 'string' || body.workoutType === null)
      updates.workoutType = body.workoutType;

    const [updated] = await db
      .update(gymSessions)
      .set(updates)
      .where(eq(gymSessions.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }
    return NextResponse.json(updated);
  } catch (err) {
    console.error('PATCH /api/gym/[id] failed', err);
    return NextResponse.json({ error: 'Failed to update session' }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = parseId(params.id);
  if (id === null) {
    return NextResponse.json({ error: 'Invalid session id' }, { status: 400 });
  }
  try {
    const [deleted] = await db
      .delete(gymSessions)
      .where(eq(gymSessions.id, id))
      .returning();
    if (!deleted) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('DELETE /api/gym/[id] failed', err);
    return NextResponse.json({ error: 'Failed to delete session' }, { status: 500 });
  }
}
