import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { mealSlots, recipes } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  const weekStart = req.nextUrl.searchParams.get('weekStart');
  if (!weekStart) {
    return NextResponse.json({ error: 'weekStart is required' }, { status: 400 });
  }
  try {
    const rows = await db
      .select({
        id: mealSlots.id,
        weekStart: mealSlots.weekStart,
        date: mealSlots.date,
        mealType: mealSlots.mealType,
        recipeId: mealSlots.recipeId,
        recipeName: recipes.name,
        recipeCalories: recipes.calories,
      })
      .from(mealSlots)
      .innerJoin(recipes, eq(mealSlots.recipeId, recipes.id))
      .where(eq(mealSlots.weekStart, weekStart));

    return NextResponse.json(rows);
  } catch (err) {
    console.error('GET /api/meal-slots failed', err);
    return NextResponse.json({ error: 'Failed to load meal plan' }, { status: 500 });
  }
}

const VALID_MEAL_TYPES = ['breakfast', 'lunch', 'dinner'];

/** Sets (creates or replaces) the recipe for a given date+mealType. Each
 *  date+mealType combination holds at most one recipe — setting a new one
 *  replaces whatever was there, rather than allowing several at once. */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const weekStart = typeof body.weekStart === 'string' ? body.weekStart : '';
    const date = typeof body.date === 'string' ? body.date : '';
    const mealType = body.mealType;
    const recipeId = Number(body.recipeId);

    if (
      !weekStart ||
      !date ||
      !VALID_MEAL_TYPES.includes(mealType) ||
      !Number.isInteger(recipeId)
    ) {
      return NextResponse.json(
        { error: 'weekStart, date, mealType, and recipeId are required' },
        { status: 400 }
      );
    }

    await db
      .delete(mealSlots)
      .where(and(eq(mealSlots.date, date), eq(mealSlots.mealType, mealType)));

    const [created] = await db
      .insert(mealSlots)
      .values({ weekStart, date, mealType, recipeId })
      .returning();

    const [recipe] = await db
      .select({ name: recipes.name, calories: recipes.calories })
      .from(recipes)
      .where(eq(recipes.id, recipeId));

    return NextResponse.json(
      {
        ...created,
        recipeName: recipe?.name ?? '',
        recipeCalories: recipe?.calories ?? null,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error('POST /api/meal-slots failed', err);
    return NextResponse.json({ error: 'Failed to set meal' }, { status: 500 });
  }
}
