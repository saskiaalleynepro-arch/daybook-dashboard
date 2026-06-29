import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { recipeIngredients } from '@/db/schema';

function parseId(idParam: string): number | null {
  const id = Number(idParam);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const recipeId = parseId(params.id);
  if (recipeId === null) {
    return NextResponse.json({ error: 'Invalid recipe id' }, { status: 400 });
  }
  try {
    const body = await req.json();
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    if (!name) {
      return NextResponse.json({ error: 'name is required' }, { status: 400 });
    }

    const [created] = await db
      .insert(recipeIngredients)
      .values({
        recipeId,
        name,
        quantity: typeof body.quantity === 'string' ? body.quantity : null,
        position: typeof body.position === 'number' ? body.position : 0,
      })
      .returning();

    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    console.error('POST /api/recipes/[id]/ingredients failed', err);
    return NextResponse.json(
      { error: 'Failed to add ingredient' },
      { status: 500 }
    );
  }
}
