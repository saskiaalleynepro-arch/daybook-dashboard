import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { shoppingListItems } from '@/db/schema';
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
    return NextResponse.json({ error: 'Invalid item id' }, { status: 400 });
  }
  try {
    const body = await req.json();
    const updates: Partial<typeof shoppingListItems.$inferInsert> = {};
    if (typeof body.checked === 'boolean') updates.checked = body.checked;
    if (typeof body.name === 'string') updates.name = body.name.trim();
    if (typeof body.quantity === 'string' || body.quantity === null)
      updates.quantity = body.quantity;

    const [updated] = await db
      .update(shoppingListItems)
      .set(updates)
      .where(eq(shoppingListItems.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }
    return NextResponse.json(updated);
  } catch (err) {
    console.error('PATCH /api/shopping-list/[id] failed', err);
    return NextResponse.json({ error: 'Failed to update item' }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = parseId(params.id);
  if (id === null) {
    return NextResponse.json({ error: 'Invalid item id' }, { status: 400 });
  }
  try {
    const [deleted] = await db
      .delete(shoppingListItems)
      .where(eq(shoppingListItems.id, id))
      .returning();
    if (!deleted) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('DELETE /api/shopping-list/[id] failed', err);
    return NextResponse.json({ error: 'Failed to delete item' }, { status: 500 });
  }
}
