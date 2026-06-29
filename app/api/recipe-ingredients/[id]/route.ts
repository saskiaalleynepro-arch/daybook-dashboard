import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { recipeIngredients } from '@/db/schema';
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
    return NextResponse.json({ error: 'Invalid ingredient id' }, { status: 400 });
  }
  try {
    const body = await req.json();
    const updates: Partial<typeof recipeIngredients.$inferInsert> = {};
    if (typeof body.name === 'string') updates.name = body.name.trim();
    if (typeof body.quantity === 'string' || body.quantity === null)
      updates.quantity = body.quantity;

    const [updated] = await db
      .update(recipeIngredients)
      .set(updates)
      .where(eq(recipeIngredients.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: 'Ingredient not found' }, { status: 404 });
    }
    return NextResponse.json(updated);
  } catch (err) {
    console.error('PATCH /api/recipe-ingredients/[id] failed', err);
    return NextResponse.json(
      { error: 'Failed to update ingredient' },
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
    return NextResponse.json({ error: 'Invalid ingredient id' }, { status: 400 });
  }
  try {
    const [deleted] = await db
      .delete(recipeIngredients)
      .where(eq(recipeIngredients.id, id))
      .returning();
    if (!deleted) {
      return NextResponse.json({ error: 'Ingredient not found' }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('DELETE /api/recipe-ingredients/[id] failed', err);
    return NextResponse.json(
      { error: 'Failed to delete ingredient' },
      { status: 500 }
    );
  }
}
