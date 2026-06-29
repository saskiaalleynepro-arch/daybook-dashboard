import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { books } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';

const VALID_STATUSES = ['currently_reading', 'read', 'want_to_read'];

export async function GET(req: NextRequest) {
  const status = req.nextUrl.searchParams.get('status');
  if (status && !VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: 'Invalid status filter' }, { status: 400 });
  }
  try {
    const rows = status
      ? await db
          .select()
          .from(books)
          .where(eq(books.status, status as 'currently_reading' | 'read' | 'want_to_read'))
          .orderBy(desc(books.createdAt))
      : await db.select().from(books).orderBy(desc(books.createdAt));
    return NextResponse.json(rows);
  } catch (err) {
    console.error('GET /api/books failed', err);
    return NextResponse.json({ error: 'Failed to load books' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const title = typeof body.title === 'string' ? body.title.trim() : '';
    const openLibraryKey =
      typeof body.openLibraryKey === 'string' ? body.openLibraryKey : '';
    if (!title || !openLibraryKey) {
      return NextResponse.json(
        { error: 'title and openLibraryKey are required' },
        { status: 400 }
      );
    }
    const status = VALID_STATUSES.includes(body.status)
      ? body.status
      : 'currently_reading';

    const [created] = await db
      .insert(books)
      .values({
        openLibraryKey,
        title,
        author: typeof body.author === 'string' ? body.author : null,
        coverUrl: typeof body.coverUrl === 'string' ? body.coverUrl : null,
        status,
        startedAt: status === 'currently_reading' ? new Date() : null,
      })
      .returning();

    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    console.error('POST /api/books failed', err);
    return NextResponse.json({ error: 'Failed to add book' }, { status: 500 });
  }
}
