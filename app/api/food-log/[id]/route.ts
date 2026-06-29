import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { foodLogEntries } from '@/db/schema';
import { eq } from 'drizzle-orm';

function parseId(idParam: string): number | null {
  const id = Number(idParam);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = parseId(params.id);
  if (id === null) {
    return NextResponse.json({ error: 'Invalid entry id' }, { status: 400 });
  }
  try {
    const [deleted] = await db
      .delete(foodLogEntries)
      .where(eq(foodLogEntries.id, id))
      .returning();
    if (!deleted) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('DELETE /api/food-log/[id] failed', err);
    return NextResponse.json({ error: 'Failed to delete entry' }, { status: 500 });
  }
}
