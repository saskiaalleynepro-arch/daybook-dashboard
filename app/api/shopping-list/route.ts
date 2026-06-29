import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { shoppingListItems } from '@/db/schema';
import { asc } from 'drizzle-orm';

export async function GET() {
  try {
    const rows = await db
      .select()
      .from(shoppingListItems)
      .orderBy(asc(shoppingListItems.checked), asc(shoppingListItems.position));
    return NextResponse.json(rows);
  } catch (err) {
    console.error('GET /api/shopping-list failed', err);
    return NextResponse.json(
      { error: 'Failed to load shopping list' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    if (!name) {
      return NextResponse.json({ error: 'name is required' }, { status: 400 });
    }

    const [created] = await db
      .insert(shoppingListItems)
      .values({
        name,
        quantity: typeof body.quantity === 'string' ? body.quantity : null,
      })
      .returning();

    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    console.error('POST /api/shopping-list failed', err);
    return NextResponse.json({ error: 'Failed to add item' }, { status: 500 });
  }
}
