import { NextRequest, NextResponse } from 'next/server';

/** Proxies search to the Open Library API server-side, since calling it
 *  directly from the browser would need CORS handling we don't control.
 *  No API key needed — Open Library's search endpoint is public. */
export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get('q');
  if (!query || !query.trim()) {
    return NextResponse.json({ error: 'q is required' }, { status: 400 });
  }

  try {
    const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(
      query
    )}&fields=key,title,author_name,cover_i&limit=8`;

    const res = await fetch(url, {
      headers: { 'User-Agent': 'Daybook-Dashboard/1.0' },
    });

    if (!res.ok) {
      throw new Error(`Open Library returned ${res.status}`);
    }

    const data = await res.json();

    const results = (data.docs ?? []).map((doc: any) => ({
      openLibraryKey: doc.key as string,
      title: doc.title as string,
      author: Array.isArray(doc.author_name) ? doc.author_name[0] : null,
      coverUrl: doc.cover_i
        ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg`
        : null,
    }));

    return NextResponse.json(results);
  } catch (err) {
    console.error('GET /api/books/search failed', err);
    return NextResponse.json(
      { error: 'Book search is unavailable right now' },
      { status: 502 }
    );
  }
}
