'use client';

import { useEffect, useState } from 'react';
import { BookOpenText } from 'lucide-react';

export default function Reflections({ weekStart }: { weekStart: string }) {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/reflections?weekStart=${weekStart}`)
      .then((r) => r.json())
      .then((data) => setContent(data.content ?? ''))
      .catch(() => setError('Could not load reflections.'))
      .finally(() => setLoading(false));
  }, [weekStart]);

  async function save() {
    try {
      const res = await fetch('/api/reflections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weekStart, content }),
      });
      if (!res.ok) throw new Error();
      setSavedAt(Date.now());
    } catch {
      setError('Could not save your reflection.');
    }
  }

  return (
    <section className="bg-white/60 border border-line rounded-sm p-5">
      <h3 className="font-serif text-lg text-ink mb-3 flex items-center gap-2">
        <BookOpenText size={16} className="text-accent" />
        Reflections
      </h3>

      {error && (
        <p className="text-xs text-warn mb-2" role="alert">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-sm text-ink/40 italic">Loading…</p>
      ) : (
        <>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onBlur={save}
            placeholder="How did this week go? What did you learn?"
            rows={5}
            className="w-full resize-none bg-transparent text-sm text-ink/80 leading-relaxed focus:outline-none placeholder:text-ink/35"
          />
          {savedAt && (
            <p className="text-[10px] text-ink/30 mt-1">Saved</p>
          )}
        </>
      )}
    </section>
  );
}
