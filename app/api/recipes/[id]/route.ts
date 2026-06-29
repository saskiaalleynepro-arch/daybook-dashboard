import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { recipes } from '@/db/schema';
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
    return NextResponse.json({ error: 'Invalid recipe id' }, { status: 400 });
  }
  try {
    const body = await req.json();
    const updates: Partial<typeof recipes.$inferInsert> = {};
    if (typeof body.name === 'string') updates.name = body.name.trim();
    if (typeof body.calories === 'number' || body.calories === null)
      updates.calories = body.calories;
    if (typeof body.notes === 'string' || body.notes === null)
      updates.notes = body.notes;

    const [updated] = await db
      .update(recipes)
      .set(updates)
      .where(eq(recipes.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: 'Recipe not found' }, { status: 404 });
    }
    return NextResponse.json(updated);
  } catch (err) {
    console.error('PATCH /api/recipes/[id] failed', err);
    return NextResponse.json({ error: 'Failed to update recipe' }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = parseId(params.id);
  if (id === null) {
    return NextResponse.json({ error: 'Invalid recipe id' }, { status: 400 });
  }
  try {
    // recipe_ingredients cascade-delete via FK; meal_slots referencing this
    // recipe also cascade-delete, so removing a recipe clears it from any
    // week it was planned into.
    const [deleted] = await db.delete(recipes).where(eq(recipes.id, id)).returning();
    if (!deleted) {
      return NextResponse.json({ error: 'Recipe not found' }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('DELETE /api/recipes/[id] failed', err);
    return NextResponse.json({ error: 'Failed to delete recipe' }, { status: 500 });
  }
}
