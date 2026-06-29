import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { tasks } from '@/db/schema';
import { asc, desc } from 'drizzle-orm';

export async function GET() {
  try {
    const rows = await db
      .select()
      .from(tasks)
      .orderBy(asc(tasks.done), desc(tasks.createdAt));
    return NextResponse.json(rows);
  } catch (err) {
    console.error('GET /api/tasks failed', err);
    return NextResponse.json(
      { error: 'Failed to load tasks' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const title = typeof body.title === 'string' ? body.title.trim() : '';
    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const priority = ['low', 'medium', 'high'].includes(body.priority)
      ? body.priority
      : 'medium';

    const [created] = await db
      .insert(tasks)
      .values({
        title,
        description: typeof body.description === 'string' ? body.description : null,
        priority,
        dueDate: typeof body.dueDate === 'string' && body.dueDate ? body.dueDate : null,
      })
      .returning();

    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    console.error('POST /api/tasks failed', err);
    return NextResponse.json(
      { error: 'Failed to create task' },
      { status: 500 }
    );
  }
}
