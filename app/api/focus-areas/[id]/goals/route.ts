import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { focusGoals } from '@/db/schema';

function parseId(idParam: string): number | null {
  const id = Number(idParam);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const focusAreaId = parseId(params.id);
  if (focusAreaId === null) {
    return NextResponse.json({ error: 'Invalid focus area id' }, { status: 400 });
  }
  try {
    const body = await req.json();
    const title = typeof body.title === 'string' ? body.title.trim() : '';
    if (!title) {
      return NextResponse.json({ error: 'title is required' }, { status: 400 });
    }

    const [created] = await db
      .insert(focusGoals)
      .values({
        focusAreaId,
        title,
        position: typeof body.position === 'number' ? body.position : 0,
      })
      .returning();

    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    console.error('POST /api/focus-areas/[id]/goals failed', err);
    return NextResponse.json({ error: 'Failed to add goal' }, { status: 500 });
  }
}
