import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { habits } from '@/db/schema';
import { eq } from 'drizzle-orm';

/** Accepts an ordered list of habit ids and writes their new position
 *  values in one batch. Run as sequential updates rather than a single
 *  multi-row statement, since Drizzle's neon-http driver doesn't support
 *  transactions — for a handful of habits this is fast enough either way. */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const orderedIds: unknown = body.orderedIds;
    if (
      !Array.isArray(orderedIds) ||
      !orderedIds.every((id) => Number.isInteger(id))
    ) {
      return NextResponse.json(
        { error: 'orderedIds must be an array of integers' },
        { status: 400 }
      );
    }

    await Promise.all(
      orderedIds.map((id: number, index: number) =>
        db.update(habits).set({ position: index }).where(eq(habits.id, id))
      )
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('POST /api/habits/reorder failed', err);
    return NextResponse.json(
      { error: 'Failed to reorder habits' },
      { status: 500 }
    );
  }
}
