import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { recipes, recipeIngredients } from '@/db/schema';
import { asc, inArray } from 'drizzle-orm';

export async function GET() {
  try {
    const allRecipes = await db
      .select()
      .from(recipes)
      .orderBy(asc(recipes.name));

    const recipeIds = allRecipes.map((r) => r.id);
    const ingredients = recipeIds.length
      ? await db
          .select()
          .from(recipeIngredients)
          .where(inArray(recipeIngredients.recipeId, recipeIds))
          .orderBy(asc(recipeIngredients.position))
      : [];

    const ingredientsByRecipe = new Map<number, typeof ingredients>();
    for (const ing of ingredients) {
      const list = ingredientsByRecipe.get(ing.recipeId) ?? [];
      list.push(ing);
      ingredientsByRecipe.set(ing.recipeId, list);
    }

    const result = allRecipes.map((r) => ({
      ...r,
      ingredients: ingredientsByRecipe.get(r.id) ?? [],
    }));

    return NextResponse.json(result);
  } catch (err) {
    console.error('GET /api/recipes failed', err);
    return NextResponse.json({ error: 'Failed to load recipes' }, { status: 500 });
  }
}

/** Creates a recipe along with its ingredients in one call, since a recipe
 *  without at least its initial ingredient list isn't very useful — the
 *  client always has the full ingredient set available when creating. */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    if (!name) {
      return NextResponse.json({ error: 'name is required' }, { status: 400 });
    }

    const ingredientsInput: { name: string; quantity?: string }[] = Array.isArray(
      body.ingredients
    )
      ? body.ingredients.filter(
          (i: any) => typeof i?.name === 'string' && i.name.trim()
        )
      : [];

    const [created] = await db
      .insert(recipes)
      .values({
        name,
        calories:
          typeof body.calories === 'number' && body.calories >= 0
            ? Math.round(body.calories)
            : null,
        notes: typeof body.notes === 'string' ? body.notes : null,
      })
      .returning();

    const createdIngredients = ingredientsInput.length
      ? await db
          .insert(recipeIngredients)
          .values(
            ingredientsInput.map((i, idx) => ({
              recipeId: created.id,
              name: i.name.trim(),
              quantity: typeof i.quantity === 'string' ? i.quantity : null,
              position: idx,
            }))
          )
          .returning()
      : [];

    return NextResponse.json(
      { ...created, ingredients: createdIngredients },
      { status: 201 }
    );
  } catch (err) {
    console.error('POST /api/recipes failed', err);
    return NextResponse.json({ error: 'Failed to create recipe' }, { status: 500 });
  }
}
