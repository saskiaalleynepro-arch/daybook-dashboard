import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { books } from '@/db/schema';
import { eq } from 'drizzle-orm';

const VALID_STATUSES = ['currently_reading', 'read', 'want_to_read'];

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
    return NextResponse.json({ error: 'Invalid book id' }, { status: 400 });
  }
  try {
    const body = await req.json();
    const updates: Partial<typeof books.$inferInsert> = {};

    if (VALID_STATUSES.includes(body.status)) {
      updates.status = body.status;
      if (body.status === 'read') updates.finishedAt = new Date();
      if (body.status === 'currently_reading') updates.startedAt = new Date();
    }

    const [updated] = await db
      .update(books)
      .set(updates)
      .where(eq(books.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 });
    }
    return NextResponse.json(updated);
  } catch (err) {
    console.error('PATCH /api/books/[id] failed', err);
    return NextResponse.json({ error: 'Failed to update book' }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = parseId(params.id);
  if (id === null) {
    return NextResponse.json({ error: 'Invalid book id' }, { status: 400 });
  }
  try {
    const [deleted] = await db.delete(books).where(eq(books.id, id)).returning();
    if (!deleted) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('DELETE /api/books/[id] failed', err);
    return NextResponse.json({ error: 'Failed to delete book' }, { status: 500 });
  }
}
