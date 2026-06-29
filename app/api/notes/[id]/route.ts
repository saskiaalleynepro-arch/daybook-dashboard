import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { notes } from '@/db/schema';
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
    return NextResponse.json({ error: 'Invalid note id' }, { status: 400 });
  }

  try {
    const body = await req.json();
    const updates: Partial<typeof notes.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (typeof body.title === 'string') updates.title = body.title.trim() || 'Untitled note';
    if (typeof body.content === 'string') updates.content = body.content;
    if (typeof body.pinned === 'boolean') updates.pinned = body.pinned;

    const [updated] = await db
      .update(notes)
      .set(updates)
      .where(eq(notes.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }
    return NextResponse.json(updated);
  } catch (err) {
    console.error('PATCH /api/notes/[id] failed', err);
    return NextResponse.json(
      { error: 'Failed to update note' },
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
    return NextResponse.json({ error: 'Invalid note id' }, { status: 400 });
  }

  try {
    const [deleted] = await db
      .delete(notes)
      .where(eq(notes.id, id))
      .returning();

    if (!deleted) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('DELETE /api/notes/[id] failed', err);
    return NextResponse.json(
      { error: 'Failed to delete note' },
      { status: 500 }
    );
  }
}
