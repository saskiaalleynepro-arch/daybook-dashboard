'use client';

import { useEffect, useRef, useState } from 'react';
import { Search, X, Check, BookMarked } from 'lucide-react';
import type { BookDTO, BookSearchResult } from '@/lib/types';

export default function CurrentlyReadingWidget() {
  const [book, setBook] = useState<BookDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<BookSearchResult[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetch('/api/books?status=currently_reading')
      .then((r) => r.json())
      .then((data: BookDTO[]) => setBook(data[0] ?? null))
      .catch(() => setError('Could not load your current book.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) {
      setResults([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/books/search?q=${encodeURIComponent(query)}`);
        if (!res.ok) throw new Error();
        setResults(await res.json());
      } catch {
        setError('Search is unavailable right now.');
      } finally {
        setSearching(false);
      }
    }, 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  async function selectBook(result: BookSearchResult) {
    try {
      const res = await fetch('/api/books', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...result, status: 'currently_reading' }),
      });
      if (!res.ok) throw new Error();
      const created: BookDTO = await res.json();
      setBook(created);
      setSearchOpen(false);
      setQuery('');
      setResults([]);
    } catch {
      setError('Could not add that book.');
    }
  }

  async function markFinished() {
    if (!book) return;
    const prev = book;
    setBook(null);
    try {
      const res = await fetch(`/api/books/${book.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'read' }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setBook(prev);
      setError('Could not mark that book as finished.');
    }
  }

  return (
    <section className="bg-white/60 border border-line rounded-sm p-5">
      <h3 className="font-serif text-lg text-ink mb-3 flex items-center gap-2">
        <BookMarked size={16} className="text-accent" />
        Currently reading
      </h3>

      {error && (
        <p className="text-xs text-warn mb-2" role="alert">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-sm text-ink/40 italic">Loading…</p>
      ) : book && !searchOpen ? (
        <div className="flex gap-3">
          {book.coverUrl ? (
            <img
              src={book.coverUrl}
              alt={`Cover of ${book.title}`}
              className="w-14 h-20 object-cover rounded-sm border border-line flex-shrink-0"
            />
          ) : (
            <div className="w-14 h-20 rounded-sm border border-line bg-accentSoft flex-shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-ink leading-snug">
              {book.title}
            </p>
            {book.author && (
              <p className="text-xs text-ink/50 mt-0.5">{book.author}</p>
            )}
            <div className="flex gap-3 mt-2">
              <button
                onClick={markFinished}
                className="text-xs text-accent hover:underline flex items-center gap-1"
              >
                <Check size={11} /> Mark finished
              </button>
              <button
                onClick={() => setSearchOpen(true)}
                className="text-xs text-ink/40 hover:text-ink hover:underline"
              >
                Change book
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div>
          <div className="relative mb-2">
            <Search
              size={14}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink/30"
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for a book by title…"
              autoFocus={searchOpen}
              className="w-full bg-transparent border border-line rounded-sm pl-8 pr-8 py-1.5 text-sm placeholder:text-ink/35 focus:border-accent transition-colors"
            />
            {book && (
              <button
                onClick={() => {
                  setSearchOpen(false);
                  setQuery('');
                  setResults([]);
                }}
                aria-label="Cancel search"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink/30 hover:text-ink"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {searching && (
            <p className="text-xs text-ink/40 italic">Searching…</p>
          )}

          {results.length > 0 && (
            <ul className="space-y-1.5 max-h-64 overflow-y-auto">
              {results.map((r) => (
                <li key={r.openLibraryKey}>
                  <button
                    onClick={() => selectBook(r)}
                    className="w-full flex gap-2.5 items-start text-left p-1.5 rounded-sm hover:bg-accentSoft/50 transition-colors"
                  >
                    {r.coverUrl ? (
                      <img
                        src={r.coverUrl}
                        alt=""
                        className="w-8 h-11 object-cover rounded-sm border border-line flex-shrink-0"
                      />
                    ) : (
                      <div className="w-8 h-11 rounded-sm border border-line bg-accentSoft flex-shrink-0" />
                    )}
                    <span className="min-w-0">
                      <span className="block text-xs font-medium text-ink truncate">
                        {r.title}
                      </span>
                      {r.author && (
                        <span className="block text-[11px] text-ink/50 truncate">
                          {r.author}
                        </span>
                      )}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}
