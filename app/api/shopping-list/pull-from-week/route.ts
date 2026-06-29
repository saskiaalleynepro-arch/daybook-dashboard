import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import {
  mealSlots,
  recipeIngredients,
  shoppingListItems,
} from '@/db/schema';
import { eq, inArray } from 'drizzle-orm';

/** Adds every ingredient from this week's planned meals to the shopping
 *  list. Ingredients with the same name (case-insensitive) are merged into
 *  one shopping list line, combining their quantities as a joined string
 *  (e.g. "2 cups, 1 lb") rather than attempting unit-aware math — recipe
 *  quantities are free-text, so arithmetic merging isn't reliable anyway. */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const weekStart = typeof body.weekStart === 'string' ? body.weekStart : '';
    if (!weekStart) {
      return NextResponse.json({ error: 'weekStart is required' }, { status: 400 });
    }

    const slots = await db
      .select({ recipeId: mealSlots.recipeId })
      .from(mealSlots)
      .where(eq(mealSlots.weekStart, weekStart));

    if (slots.length === 0) {
      return NextResponse.json({ added: [] });
    }

    const recipeIds = Array.from(new Set(slots.map((s) => s.recipeId)));
    const ingredients = await db
      .select()
      .from(recipeIngredients)
      .where(inArray(recipeIngredients.recipeId, recipeIds));

    // Merge by lowercase name.
    const merged = new Map<string, { name: string; quantities: string[] }>();
    for (const ing of ingredients) {
      const key = ing.name.toLowerCase().trim();
      const existing = merged.get(key);
      if (existing) {
        if (ing.quantity) existing.quantities.push(ing.quantity);
      } else {
        merged.set(key, {
          name: ing.name,
          quantities: ing.quantity ? [ing.quantity] : [],
        });
      }
    }

    const toInsert = Array.from(merged.values()).map((m) => ({
      name: m.name,
      quantity: m.quantities.length ? m.quantities.join(', ') : null,
    }));

    const created = toInsert.length
      ? await db.insert(shoppingListItems).values(toInsert).returning()
      : [];

    return NextResponse.json({ added: created });
  } catch (err) {
    console.error('POST /api/shopping-list/pull-from-week failed', err);
    return NextResponse.json(
      { error: 'Failed to pull in this week\'s meals' },
      { status: 500 }
    );
  }
}
