import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { gymExercises } from '@/db/schema';

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
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    if (!name) {
      return NextResponse.json({ error: 'name is required' }, { status: 400 });
    }

    const [created] = await db
      .insert(gymExercises)
      .values({
        sessionId,
        name,
        sets: typeof body.sets === 'number' ? body.sets : null,
        reps: typeof body.reps === 'number' ? body.reps : null,
        weight: typeof body.weight === 'number' ? body.weight : null,
        restSeconds: typeof body.restSeconds === 'number' ? body.restSeconds : 60,
        position: typeof body.position === 'number' ? body.position : 0,
      })
      .returning();

    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    console.error('POST /api/gym/[id]/exercises failed', err);
    return NextResponse.json({ error: 'Failed to add exercise' }, { status: 500 });
  }
}
