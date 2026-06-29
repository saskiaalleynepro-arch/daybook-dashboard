import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { gymExercises } from '@/db/schema';
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
    return NextResponse.json({ error: 'Invalid exercise id' }, { status: 400 });
  }
  try {
    const body = await req.json();
    const updates: Partial<typeof gymExercises.$inferInsert> = {};
    if (typeof body.name === 'string') updates.name = body.name.trim();
    if (typeof body.sets === 'number' || body.sets === null) updates.sets = body.sets;
    if (typeof body.reps === 'number' || body.reps === null) updates.reps = body.reps;
    if (typeof body.weight === 'number' || body.weight === null)
      updates.weight = body.weight;
    if (typeof body.restSeconds === 'number' || body.restSeconds === null)
      updates.restSeconds = body.restSeconds;
    if (typeof body.setsCompleted === 'number' && body.setsCompleted >= 0) {
      updates.setsCompleted = body.setsCompleted;
    }

    const [updated] = await db
      .update(gymExercises)
      .set(updates)
      .where(eq(gymExercises.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: 'Exercise not found' }, { status: 404 });
    }
    return NextResponse.json(updated);
  } catch (err) {
    console.error('PATCH /api/gym-exercises/[id] failed', err);
    return NextResponse.json({ error: 'Failed to update exercise' }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = parseId(params.id);
  if (id === null) {
    return NextResponse.json({ error: 'Invalid exercise id' }, { status: 400 });
  }
  try {
    const [deleted] = await db
      .delete(gymExercises)
      .where(eq(gymExercises.id, id))
      .returning();
    if (!deleted) {
      return NextResponse.json({ error: 'Exercise not found' }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('DELETE /api/gym-exercises/[id] failed', err);
    return NextResponse.json({ error: 'Failed to delete exercise' }, { status: 500 });
  }
}
