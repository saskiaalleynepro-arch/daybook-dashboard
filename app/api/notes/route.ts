import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { notes } from '@/db/schema';
import { desc } from 'drizzle-orm';

export async function GET() {
  try {
    const rows = await db
      .select()
      .from(notes)
      .orderBy(desc(notes.pinned), desc(notes.updatedAt));
    return NextResponse.json(rows);
  } catch (err) {
    console.error('GET /api/notes failed', err);
    return NextResponse.json(
      { error: 'Failed to load notes' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const title = typeof body.title === 'string' ? body.title.trim() : '';

    const [created] = await db
      .insert(notes)
      .values({
        title: title || 'Untitled note',
        content: typeof body.content === 'string' ? body.content : '',
      })
      .returning();

    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    console.error('POST /api/notes failed', err);
    return NextResponse.json(
      { error: 'Failed to create note' },
      { status: 500 }
    );
  }
}
