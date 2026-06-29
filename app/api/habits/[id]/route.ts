import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { habits } from '@/db/schema';
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
    return NextResponse.json({ error: 'Invalid habit id' }, { status: 400 });
  }

  try {
    const body = await req.json();
    const updates: Partial<typeof habits.$inferInsert> = {};

    if (typeof body.name === 'string') updates.name = body.name.trim();
    if (typeof body.emoji === 'string') updates.emoji = body.emoji;
    if (typeof body.color === 'string' && HEX_COLOR.test(body.color))
      updates.color = body.color;
    if (body.section === 'daily' || body.section === 'devotional')
      updates.section = body.section;
    if (typeof body.archived === 'boolean') updates.archived = body.archived;
    if (typeof body.position === 'number') updates.position = body.position;
    if (
      Number.isInteger(body.targetPerWeek) &&
      body.targetPerWeek > 0 &&
      body.targetPerWeek <= 7
    ) {
      updates.targetPerWeek = body.targetPerWeek;
    }

    const [updated] = await db
      .update(habits)
      .set(updates)
      .where(eq(habits.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: 'Habit not found' }, { status: 404 });
    }
    return NextResponse.json(updated);
  } catch (err) {
    console.error('PATCH /api/habits/[id] failed', err);
    return NextResponse.json(
      { error: 'Failed to update habit' },
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
    return NextResponse.json({ error: 'Invalid habit id' }, { status: 400 });
  }

  try {
    // habit_logs rows cascade-delete via the FK constraint.
    const [deleted] = await db
      .delete(habits)
      .where(eq(habits.id, id))
      .returning();

    if (!deleted) {
      return NextResponse.json({ error: 'Habit not found' }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('DELETE /api/habits/[id] failed', err);
    return NextResponse.json(
      { error: 'Failed to delete habit' },
      { status: 500 }
    );
  }
}
