import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { gymExercises } from '@/db/schema';
import { eq } from 'drizzle-orm';

function parseId(idParam: string): number | null {
  const id = Number(idParam);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const sessionId = parseId(params.id);
  if (sessionId === null) {
    return NextResponse.json({ error: 'Invalid session id' }, { status: 400 });
  }
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
        db
          .update(gymExercises)
          .set({ position: index })
          .where(eq(gymExercises.id, id))
      )
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('POST /api/gym/[id]/exercises/reorder failed', err);
    return NextResponse.json(
      { error: 'Failed to reorder exercises' },
      { status: 500 }
    );
  }
}
